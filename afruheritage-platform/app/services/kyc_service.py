from __future__ import annotations
import httpx
from sqlalchemy.orm import Session
from app.models.kyc import KYCSubmission, KYCStatus
from app.models.user import User
from app.core.config import settings
import uuid

FLEETBASE_KYC_API = getattr(settings, "FLEETBASE_KYC_API", "https://api.fleetbase.io/kyc")
FLEETBASE_KYC_KEY = getattr(settings, "FLEETBASE_KYC_KEY", "")

async def submit_id_document(user: User, file_url: str, db: Session) -> KYCSubmission:
    # Create or update KYCSubmission
    kyc = db.query(KYCSubmission).filter_by(user_id=user.id).first()
    if not kyc:
        kyc = KYCSubmission(user_id=user.id, status=KYCStatus.pending, id_document_url=file_url)
        db.add(kyc)
    else:
        kyc.id_document_url = file_url
        kyc.status = KYCStatus.pending
    db.commit()
    db.refresh(kyc)
    # Call Fleetbase KYC API (mocked for now)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{FLEETBASE_KYC_API}/document",
            headers={"Authorization": f"Bearer {FLEETBASE_KYC_KEY}"},
            json={"user_id": str(user.id), "file_url": file_url},
        )
        # TODO: Parse response, update status/result
    return kyc

async def submit_liveness_video(user: User, file_url: str, db: Session) -> KYCSubmission:
    kyc = db.query(KYCSubmission).filter_by(user_id=user.id).first()
    if not kyc:
        kyc = KYCSubmission(user_id=user.id, status=KYCStatus.pending, liveness_video_url=file_url)
        db.add(kyc)
    else:
        kyc.liveness_video_url = file_url
        kyc.status = KYCStatus.pending
    db.commit()
    db.refresh(kyc)
    # Call Fleetbase KYC API (mocked for now)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{FLEETBASE_KYC_API}/liveness",
            headers={"Authorization": f"Bearer {FLEETBASE_KYC_KEY}"},
            json={"user_id": str(user.id), "file_url": file_url},
        )
        # TODO: Parse response, update status/result

    return kyc

import logging
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.core.structured_logging import get_logger

logger = get_logger("afruheritage.kyc")


class KYCService:
    """KYC verification service with liveness detection"""
    
    def __init__(self):
        self.liveness_threshold = 70  # 70% confidence threshold
    
    async def perform_kyc_verification(
        self,
        db: Session,
        user_id: str,
        id_document: bytes,
        selfie_video: bytes,
        id_type: str,
        id_number: str,
        full_name: str
    ) -> dict[str, Any]:
        """Perform complete KYC verification with liveness check"""
        try:
            # Step 1: Liveness detection
            liveness_result = await self._analyze_liveness_video(selfie_video)
            
            # Step 2: Face extraction from video
            face_image = await self._extract_face_from_video(selfie_video)
            
            # Step 3: ID document verification
            id_result = await self._verify_id_document(id_document, id_type, id_number, full_name)
            
            # Step 4: Face matching
            face_match = await self._compare_faces(face_image, id_result.get("photo"))
            
            # Step 5: Calculate overall status
            overall_status = self._calculate_overall_status(liveness_result, face_match, id_result)
            
            # Step 6: Save KYC record
            kyc_record = {
                "user_id": user_id,
                "liveness_score": liveness_result["score"],
                "liveness_passed": liveness_result["passed"],
                "face_match_score": face_match["score"],
                "face_match_passed": face_match["passed"],
                "id_verified": id_result["verified"],
                "id_type": id_type,
                "id_number": id_number,
                "extracted_data": id_result.get("extracted_data", {}),
                "overall_status": overall_status,
                "verified_at": datetime.utcnow() if overall_status == "approved" else None,
                "created_at": datetime.utcnow()
            }
            
            logger.info("KYC verification completed", extra={
                "user_id": user_id,
                "overall_status": overall_status,
                "liveness_score": liveness_result["score"],
                "face_match_score": face_match["score"]
            })
            
            return kyc_record
        
        except Exception as e:
            logger.error("KYC verification failed", extra={
                "user_id": user_id,
                "error": str(e)
            })
            raise
    
    async def _analyze_liveness_video(self, video_bytes: bytes) -> dict[str, Any]:
        """Analyze video for liveness indicators using OpenCV (blink and head movement detection)"""
        import cv2
        import numpy as np
        import tempfile
        import os
        try:
            # Write video_bytes to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp:
                tmp.write(video_bytes)
                video_path = tmp.name

            cap = cv2.VideoCapture(video_path)
            blink_detected = False
            head_movement = False
            face_consistency = 0
            frame_count = 0
            prev_face = None
            face_positions = []

            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)
                if len(faces) > 0:
                    (x, y, w, h) = faces[0]
                    face_roi = gray[y:y+h, x:x+w]
                    eyes = eye_cascade.detectMultiScale(face_roi)
                    # Blink detection: if eyes disappear in some frames
                    if frame_count > 0 and len(eyes) == 0:
                        blink_detected = True
                    # Head movement: track face position changes
                    face_center = (x + w//2, y + h//2)
                    face_positions.append(face_center)
                    if prev_face is not None:
                        dist = np.linalg.norm(np.array(face_center) - np.array(prev_face))
                        if dist > 15:
                            head_movement = True
                    prev_face = face_center
                frame_count += 1

            cap.release()
            os.remove(video_path)

            # Face consistency: how many frames had a face detected
            face_consistency = int(100 * len(face_positions) / max(frame_count, 1))

            # Calculate liveness score
            score = 0
            if blink_detected:
                score += 30
            if head_movement:
                score += 30
            if face_consistency > 70:
                score += 20
            if frame_count > 10:
                score += 20

            return {
                "score": score,
                "passed": score >= self.liveness_threshold,
                "indicators": {
                    "blink_detected": blink_detected,
                    "head_movement": head_movement,
                    "face_consistency": face_consistency
                }
            }
        except Exception as e:
            logger.error("Liveness analysis failed", extra={"error": str(e)})
            return {"score": 0, "passed": False, "error": str(e)}
    
    async def _extract_face_from_video(self, video_bytes: bytes) -> bytes:
        """Extract the clearest face image from the video using OpenCV."""
        import cv2
        import numpy as np
        import tempfile
        import os
        from PIL import Image
        import io
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp:
                tmp.write(video_bytes)
                video_path = tmp.name

            cap = cv2.VideoCapture(video_path)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            max_face_area = 0
            best_face_img = None

            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)
                for (x, y, w, h) in faces:
                    area = w * h
                    if area > max_face_area:
                        max_face_area = area
                        face_img = frame[y:y+h, x:x+w]
                        best_face_img = face_img

            cap.release()
            os.remove(video_path)

            if best_face_img is not None:
                pil_img = Image.fromarray(cv2.cvtColor(best_face_img, cv2.COLOR_BGR2RGB))
                buf = io.BytesIO()
                pil_img.save(buf, format='JPEG')
                return buf.getvalue()
            else:
                return b''
        except Exception as e:
            logger.error("Face extraction from video failed", extra={"error": str(e)})
            return b''
    
    async def _verify_id_document(
        self, 
        id_document: bytes, 
        id_type: str, 
        id_number: str, 
        full_name: str
    ) -> dict[str, Any]:
        """Verify ID document authenticity using OCR (pytesseract) and basic checks."""
        import pytesseract
        from PIL import Image
        import io
        import re
        try:
            img = Image.open(io.BytesIO(id_document))
            text = pytesseract.image_to_string(img)
            # Basic checks for ID number and name in OCR text
            id_found = id_number.lower() in text.lower()
            name_found = all(part.lower() in text.lower() for part in full_name.split())
            # Try to extract date of birth and expiry using regex
            dob_match = re.search(r'(\d{4}-\d{2}-\d{2})', text)
            dob = dob_match.group(1) if dob_match else None
            # Score: +50 for ID, +30 for name, +10 for DOB, +10 for image quality
            score = 0
            if id_found:
                score += 50
            if name_found:
                score += 30
            if dob:
                score += 10
            if img.size[0] > 300 and img.size[1] > 200:
                score += 10
            verified = score >= 80
            extracted_data = {
                "name": full_name,
                "id_number": id_number,
                "id_type": id_type,
                "date_of_birth": dob,
            }
            # Attempt to crop a face region (placeholder: center crop)
            width, height = img.size
            left = width // 4
            top = height // 4
            right = left + width // 2
            bottom = top + height // 2
            face_crop = img.crop((left, top, right, bottom))
            buf = io.BytesIO()
            face_crop.save(buf, format='JPEG')
            id_photo = buf.getvalue()
            return {
                "verified": verified,
                "score": score,
                "extracted_data": extracted_data,
                "photo": id_photo
            }
        except Exception as e:
            logger.error("ID verification failed", extra={"error": str(e)})
            return {"verified": False, "error": str(e)}
    
    async def _compare_faces(self, face1: bytes, face2: bytes) -> dict[str, Any]:
        """Compare two faces for similarity using face_recognition library."""
        import face_recognition
        import numpy as np
        from PIL import Image
        import io
        try:
            # Load face1
            img1 = face_recognition.load_image_file(io.BytesIO(face1))
            encodings1 = face_recognition.face_encodings(img1)
            # Load face2
            img2 = face_recognition.load_image_file(io.BytesIO(face2))
            encodings2 = face_recognition.face_encodings(img2)
            if not encodings1 or not encodings2:
                return {"score": 0, "passed": False, "error": "No face found in one or both images"}
            # Compare faces
            distance = np.linalg.norm(encodings1[0] - encodings2[0])
            similarity = max(0, 1 - distance)  # Lower distance = higher similarity
            score = int(similarity * 100)
            passed = score >= 85
            return {
                "score": score,
                "passed": passed,
                "similarity": similarity
            }
        except Exception as e:
            logger.error("Face comparison failed", extra={"error": str(e)})
            return {"score": 0, "passed": False, "error": str(e)}
    
    def _calculate_overall_status(
        self, 
        liveness_result: dict[str, Any], 
        face_match: dict[str, Any], 
        id_result: dict[str, Any]
    ) -> str:
        """Calculate overall KYC status"""
        
        if not liveness_result["passed"]:
            return "rejected_liveness"
        
        if not face_match["passed"]:
            return "rejected_face_match"
        
        if not id_result["verified"]:
            return "rejected_id_verification"
        
        # All checks passed
        return "approved"
    
    async def get_kyc_status(self, db: Session, user_id: str) -> dict[str, Any]:
        """Get KYC status for user"""
        try:
            # Mock implementation - would query database
            return {
                "user_id": user_id,
                "status": "approved",  # Mock
                "verified_at": datetime.utcnow(),
                "liveness_score": 85,
                "face_match_score": 90,
                "id_verified": True
            }
        
        except Exception as e:
            logger.error("Failed to get KYC status", extra={
                "user_id": user_id,
                "error": str(e)
            })
            return {"user_id": user_id, "status": "error", "error": str(e)}


# Global service factory
def get_kyc_service() -> KYCService:
    """Get KYC service"""
    return KYCService()
