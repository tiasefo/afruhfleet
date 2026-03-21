from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

from app.core.config import settings
from app.core.structured_logging import get_logger

logger = get_logger("afruheritage.china_payments")


class ChinaPaymentService:
    """China payment integration service for AliPay and WeChat Pay"""
    
    def __init__(self):
        self.alipay_config = {
            "app_id": getattr(settings, "ALIPAY_APP_ID", ""),
            "private_key": getattr(settings, "ALIPAY_PRIVATE_KEY", ""),
            "public_key": getattr(settings, "ALIPAY_PUBLIC_KEY", ""),
            "gateway_url": "https://openapi.alipay.com/gateway.do"
        }
        
        self.wechat_config = {
            "app_id": getattr(settings, "WECHAT_APP_ID", ""),
            "mch_id": getattr(settings, "WECHAT_MCH_ID", ""),
            "api_key": getattr(settings, "WECHAT_API_KEY", ""),
            "gateway_url": "https://api.mch.weixin.qq.com"
        }
    
    async def initiate_alipay_payment(
        self,
        amount: float,
        order_info: dict[str, Any],
        currency: str = "CNY"
    ) -> dict[str, Any]:
        """Initiate AliPay payment"""
        try:
            if not self.alipay_config["app_id"]:
                # Mock implementation for testing
                return await self._mock_alipay_payment(amount, order_info)
            
            import httpx
            import urllib.parse
            
            # Generate unique order number
            out_trade_no = f"ALI_{uuid.uuid4().hex[:12].upper()}"
            
            # Prepare payment parameters
            params = {
                "app_id": self.alipay_config["app_id"],
                "method": "alipay.trade.page.pay",
                "charset": "utf-8",
                "sign_type": "RSA2",
                "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "version": "1.0",
                "notify_url": f"{settings.base_url}/api/v1/payments/webhook/alipay",
                "return_url": order_info.get("return_url", f"{settings.base_url}/payment/success"),
                "biz_content": {
                    "out_trade_no": out_trade_no,
                    "total_amount": str(amount),
                    "subject": order_info.get("description", "Payment"),
                    "product_code": "FAST_INSTANT_TRADE_PAY"
                }
            }
            
            # Sign the request (simplified - in production, use proper RSA signing)
            params["sign"] = await self._sign_alipay_request(params)
            
            # Build payment URL
            payment_url = f"{self.alipay_config['gateway_url']}?{urllib.parse.urlencode(params)}"
            
            logger.info("AliPay payment initiated", extra={
                "out_trade_no": out_trade_no,
                "amount": amount,
                "currency": currency
            })
            
            return {
                "payment_id": out_trade_no,
                "payment_url": payment_url,
                "amount": amount,
                "currency": currency,
                "provider": "alipay",
                "status": "pending"
            }
        
        except Exception as e:
            logger.error("AliPay payment initiation failed", extra={
                "amount": amount,
                "error": str(e)
            })
            return {
                "status": "failed",
                "error": str(e),
                "provider": "alipay"
            }
    
    async def initiate_wechat_payment(
        self,
        amount: float,
        order_info: dict[str, Any],
        currency: str = "CNY",
        trade_type: str = "NATIVE"  # QR code payment
    ) -> dict[str, Any]:
        """Initiate WeChat Pay payment"""
        try:
            if not self.wechat_config["app_id"]:
                # Mock implementation for testing
                return await self._mock_wechat_payment(amount, order_info)
            
            import httpx
            
            # Generate unique order number
            out_trade_no = f"WX_{uuid.uuid4().hex[:12].upper()}"
            
            # Prepare payment parameters
            params = {
                "appid": self.wechat_config["app_id"],
                "mch_id": self.wechat_config["mch_id"],
                "nonce_str": uuid.uuid4().hex[:16],
                "body": order_info.get("description", "Payment"),
                "out_trade_no": out_trade_no,
                "total_fee": int(amount * 100),  # Convert to fen
                "spbill_create_ip": "127.0.0.1",  # Should be client IP
                "notify_url": f"{settings.base_url}/api/v1/payments/webhook/wechat",
                "trade_type": trade_type
            }
            
            # Sign the request (simplified - in production, use proper MD5 signing)
            params["sign"] = await self._sign_wechat_request(params)
            
            # Build XML request
            xml_data = await self._build_xml_request(params)
            
            # Send request to WeChat Pay
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.wechat_config['gateway_url']}/pay/unifiedorder",
                    content=xml_data,
                    headers={"Content-Type": "application/xml"}
                )
                response.raise_for_status()
                
                # Parse XML response
                result = await self._parse_xml_response(response.content)
                
                if result.get("return_code") == "SUCCESS":
                    qr_code_url = result.get("code_url", "")
                    
                    logger.info("WeChat Pay payment initiated", extra={
                        "out_trade_no": out_trade_no,
                        "amount": amount,
                        "currency": currency
                    })
                    
                    return {
                        "payment_id": out_trade_no,
                        "qr_code_url": qr_code_url,
                        "qr_code_data": qr_code_url,  # For QR code generation
                        "amount": amount,
                        "currency": currency,
                        "provider": "wechat_pay",
                        "status": "pending"
                    }
                else:
                    raise Exception(f"WeChat Pay error: {result.get('return_msg', 'Unknown error')}")
        
        except Exception as e:
            logger.error("WeChat Pay initiation failed", extra={
                "amount": amount,
                "error": str(e)
            })
            return {
                "status": "failed",
                "error": str(e),
                "provider": "wechat_pay"
            }
    
    async def verify_alipay_payment(self, out_trade_no: str) -> dict[str, Any]:
        """Verify AliPay payment status"""
        try:
            if not self.alipay_config["app_id"]:
                # Mock verification
                return {
                    "verified": True,
                    "status": "success",
                    "amount": 0,
                    "paid_at": datetime.utcnow().isoformat(),
                    "trade_no": out_trade_no,
                    "mock": True
                }
            
            import httpx
            
            params = {
                "app_id": self.alipay_config["app_id"],
                "method": "alipay.trade.query",
                "charset": "utf-8",
                "sign_type": "RSA2",
                "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "version": "1.0",
                "biz_content": {
                    "out_trade_no": out_trade_no
                }
            }
            
            params["sign"] = await self._sign_alipay_request(params)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(self.alipay_config["gateway_url"], data=params)
                response.raise_for_status()
                
                result = response.json()
                
                if result.get("code") == "10000" and result.get("trade_status") == "TRADE_SUCCESS":
                    return {
                        "verified": True,
                        "status": "success",
                        "amount": float(result.get("total_amount", 0)),
                        "paid_at": result.get("send_pay_date"),
                        "trade_no": result.get("trade_no")
                    }
                else:
                    return {
                        "verified": False,
                        "status": result.get("trade_status", "unknown"),
                        "trade_no": out_trade_no
                    }
        
        except Exception as e:
            logger.error("AliPay verification failed", extra={
                "out_trade_no": out_trade_no,
                "error": str(e)
            })
            return {
                "verified": False,
                "status": "verification_failed",
                "trade_no": out_trade_no,
                "error": str(e)
            }
    
    async def verify_wechat_payment(self, out_trade_no: str) -> dict[str, Any]:
        """Verify WeChat Pay payment status"""
        try:
            if not self.wechat_config["app_id"]:
                # Mock verification
                return {
                    "verified": True,
                    "status": "success",
                    "amount": 0,
                    "paid_at": datetime.utcnow().isoformat(),
                    "transaction_id": out_trade_no,
                    "mock": True
                }
            
            import httpx
            
            params = {
                "appid": self.wechat_config["app_id"],
                "mch_id": self.wechat_config["mch_id"],
                "out_trade_no": out_trade_no,
                "nonce_str": uuid.uuid4().hex[:16]
            }
            
            params["sign"] = await self._sign_wechat_request(params)
            
            xml_data = await self._build_xml_request(params)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.wechat_config['gateway_url']}/pay/orderquery",
                    content=xml_data,
                    headers={"Content-Type": "application/xml"}
                )
                response.raise_for_status()
                
                result = await self._parse_xml_response(response.content)
                
                if result.get("return_code") == "SUCCESS" and result.get("trade_state") == "SUCCESS":
                    return {
                        "verified": True,
                        "status": "success",
                        "amount": float(result.get("total_fee", 0)) / 100,  # Convert from fen
                        "paid_at": result.get("time_end"),
                        "transaction_id": result.get("transaction_id")
                    }
                else:
                    return {
                        "verified": False,
                        "status": result.get("trade_state", "unknown"),
                        "transaction_id": out_trade_no
                    }
        
        except Exception as e:
            logger.error("WeChat Pay verification failed", extra={
                "out_trade_no": out_trade_no,
                "error": str(e)
            })
            return {
                "verified": False,
                "status": "verification_failed",
                "transaction_id": out_trade_no,
                "error": str(e)
            }
    
    async def _mock_alipay_payment(self, amount: float, order_info: dict[str, Any]) -> dict[str, Any]:
        """Mock AliPay payment for testing"""
        payment_id = f"ALI_MOCK_{uuid.uuid4().hex[:12].upper()}"
        
        return {
            "payment_id": payment_id,
            "payment_url": f"https://mock-alipay.com/pay/{payment_id}",
            "amount": amount,
            "currency": "CNY",
            "provider": "alipay",
            "status": "pending",
            "mock": True
        }
    
    async def _mock_wechat_payment(self, amount: float, order_info: dict[str, Any]) -> dict[str, Any]:
        """Mock WeChat Pay payment for testing"""
        payment_id = f"WX_MOCK_{uuid.uuid4().hex[:12].upper()}"
        
        return {
            "payment_id": payment_id,
            "qr_code_url": f"https://mock-wechat.com/qr/{payment_id}",
            "qr_code_data": payment_id,
            "amount": amount,
            "currency": "CNY",
            "provider": "wechat_pay",
            "status": "pending",
            "mock": True
        }
    
    async def _sign_alipay_request(self, params: dict[str, Any]) -> str:
        """Sign AliPay request (simplified)"""
        # Mock implementation - in production, use proper RSA signing
        return f"mock_signature_{uuid.uuid4().hex[:16]}"
    
    async def _sign_wechat_request(self, params: dict[str, Any]) -> str:
        """Sign WeChat request (simplified)"""
        # Mock implementation - in production, use proper MD5 signing
        return f"mock_signature_{uuid.uuid4().hex[:16]}"
    
    async def _build_xml_request(self, params: dict[str, Any]) -> bytes:
        """Build XML request for WeChat Pay"""
        xml = "<xml>"
        for key, value in params.items():
            xml += f"<{key}>{value}</{key}>"
        xml += "</xml>"
        return xml.encode("utf-8")
    
    async def _parse_xml_response(self, xml_content: bytes) -> dict[str, Any]:
        """Parse XML response from WeChat Pay"""
        # Mock implementation - in production, use proper XML parsing
        return {
            "return_code": "SUCCESS",
            "return_msg": "OK",
            "appid": self.wechat_config["app_id"],
            "mch_id": self.wechat_config["mch_id"],
            "nonce_str": uuid.uuid4().hex[:16],
            "sign": "mock_signature",
            "result_code": "SUCCESS",
            "prepay_id": f"prepay_{uuid.uuid4().hex[:16]}",
            "trade_type": "NATIVE",
            "code_url": f"weixin://wxpay/bizpayurl?pr={uuid.uuid4().hex[:16]}"
        }
    
    def get_supported_methods(self) -> list[dict[str, Any]]:
        """Get supported China payment methods"""
        return [
            {
                "provider": "alipay",
                "name": "AliPay",
                "currency": "CNY",
                "available": bool(self.alipay_config["app_id"]),
                "description": "China's leading digital payment platform"
            },
            {
                "provider": "wechat_pay",
                "name": "WeChat Pay",
                "currency": "CNY", 
                "available": bool(self.wechat_config["app_id"]),
                "description": "Integrated with WeChat ecosystem"
            }
        ]


# Global service factory
def get_china_payment_service() -> ChinaPaymentService:
    """Get China payment service"""
    return ChinaPaymentService()
