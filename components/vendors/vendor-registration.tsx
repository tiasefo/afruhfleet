'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Truck, 
  Car, 
  Bike, 
  CheckCircle2, 
  Upload,
  CreditCard,
  AlertCircle
} from 'lucide-react'

const vehicleTypes = [
  { id: 'truck', label: 'Truck', icon: Truck, description: 'Heavy goods, large shipments' },
  { id: 'car', label: 'Car / Van', icon: Car, description: 'Medium packages, express delivery' },
  { id: 'motorbike', label: 'Motorbike', icon: Bike, description: 'Quick deliveries, small packages' },
  { id: 'bicycle', label: 'Bicycle', icon: Bike, description: 'Eco-friendly, local deliveries' },
]

const regions = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Western North',
  'Oti',
  'North East',
  'Savannah',
]

type Step = 1 | 2 | 3 | 4

export function VendorRegistration() {
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    email: '',
    phone: '',
    idType: '',
    idNumber: '',
    
    // Vehicle Info
    vehicleTypes: [] as string[],
    vehicleRegNumber: '',
    vehicleModel: '',
    vehicleYear: '',
    
    // Business Info
    businessName: '',
    businessType: 'individual',
    operatingRegions: [] as string[],
    yearsExperience: '',
    
    // Agreement
    termsAccepted: false,
    insuranceAccepted: false,
    backgroundCheckAccepted: false,
  })

  const updateFormData = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleVehicleType = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(typeId)
        ? prev.vehicleTypes.filter(t => t !== typeId)
        : [...prev.vehicleTypes, typeId]
    }))
  }

  const toggleRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      operatingRegions: prev.operatingRegions.includes(region)
        ? prev.operatingRegions.filter(r => r !== region)
        : [...prev.operatingRegions, region]
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setIsComplete(true)
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.fullName && formData.email && formData.phone && formData.idType && formData.idNumber
      case 2:
        return formData.vehicleTypes.length > 0 && formData.vehicleRegNumber
      case 3:
        return formData.operatingRegions.length > 0
      case 4:
        return formData.termsAccepted && formData.insuranceAccepted && formData.backgroundCheckAccepted
      default:
        return false
    }
  }

  if (isComplete) {
    return (
      <section id="vendor-registration" className="py-20 lg:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="mt-6 text-2xl font-bold text-foreground">Registration Submitted!</h3>
              <p className="mt-4 max-w-md text-muted-foreground">
                Thank you for registering as a Delivery Services partner. Our team will review your application 
                and contact you within 2-3 business days.
              </p>
              <div className="mt-8 rounded-lg bg-accent/10 p-4">
                <div className="flex items-center gap-2 text-sm text-accent">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">Your Subscription: Delivery Services</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  You will use our credit-based payment system once approved.
                </p>
              </div>
              <Button className="mt-8" asChild>
                <a href="/">Return Home</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section id="vendor-registration" className="py-20 lg:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="outline" className="mb-4 border-accent/30 bg-accent/5 px-4 py-1.5 text-accent">
            Delivery Services Subscription
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Register as a Delivery Vendor
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Complete the registration to join our network. Use credits to receive jobs and get paid.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mt-12 flex items-center justify-center">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div 
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    s === step 
                      ? 'bg-primary text-primary-foreground' 
                      : s < step 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`h-0.5 w-12 sm:w-20 ${s < step ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Personal Information'}
              {step === 2 && 'Vehicle Details'}
              {step === 3 && 'Business & Coverage'}
              {step === 4 && 'Terms & Agreement'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Tell us about yourself so we can verify your identity.'}
              {step === 2 && 'Add details about your delivery vehicle(s).'}
              {step === 3 && 'Set up your business profile and service areas.'}
              {step === 4 && 'Review and accept our partnership terms.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input 
                      id="fullName" 
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => updateFormData('fullName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder="+233 XX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="idType">ID Type *</Label>
                    <Select value={formData.idType} onValueChange={(v) => updateFormData('idType', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ghana_card">Ghana Card</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="voter_id">Voter ID</SelectItem>
                        <SelectItem value="drivers_license">Driver&apos;s License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number *</Label>
                    <Input 
                      id="idNumber" 
                      placeholder="Enter ID number"
                      value={formData.idNumber}
                      onChange={(e) => updateFormData('idNumber', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Vehicle Info */}
            {step === 2 && (
              <>
                <div className="space-y-3">
                  <Label>Vehicle Type(s) *</Label>
                  <p className="text-sm text-muted-foreground">Select all vehicle types you can use for deliveries</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {vehicleTypes.map((type) => (
                      <Card 
                        key={type.id}
                        className={`cursor-pointer transition-all ${
                          formData.vehicleTypes.includes(type.id) 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => toggleVehicleType(type.id)}
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                            formData.vehicleTypes.includes(type.id) ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            <type.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                          {formData.vehicleTypes.includes(type.id) && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleRegNumber">Vehicle Registration Number *</Label>
                    <Input 
                      id="vehicleRegNumber" 
                      placeholder="e.g., GR-1234-21"
                      value={formData.vehicleRegNumber}
                      onChange={(e) => updateFormData('vehicleRegNumber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Vehicle Make/Model</Label>
                    <Input 
                      id="vehicleModel" 
                      placeholder="e.g., Toyota Hiace"
                      value={formData.vehicleModel}
                      onChange={(e) => updateFormData('vehicleModel', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleYear">Year of Manufacture</Label>
                  <Input 
                    id="vehicleYear" 
                    type="number"
                    placeholder="e.g., 2020"
                    value={formData.vehicleYear}
                    onChange={(e) => updateFormData('vehicleYear', e.target.value)}
                  />
                </div>

                <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload vehicle documents (Insurance, Roadworthy Certificate)
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Choose Files
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Business Info */}
            {step === 3 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name (Optional)</Label>
                    <Input 
                      id="businessName" 
                      placeholder="Your company name"
                      value={formData.businessName}
                      onChange={(e) => updateFormData('businessName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select value={formData.businessType} onValueChange={(v) => updateFormData('businessType', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual / Sole Proprietor</SelectItem>
                        <SelectItem value="registered">Registered Business</SelectItem>
                        <SelectItem value="fleet">Fleet Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of Delivery Experience</Label>
                  <Select value={formData.yearsExperience} onValueChange={(v) => updateFormData('yearsExperience', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">Less than 1 year</SelectItem>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5+">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Operating Regions *</Label>
                  <p className="text-sm text-muted-foreground">Select all regions where you can make deliveries</p>
                  <div className="flex flex-wrap gap-2">
                    {regions.map((region) => (
                      <Badge
                        key={region}
                        variant={formData.operatingRegions.includes(region) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-colors ${
                          formData.operatingRegions.includes(region) 
                            ? 'bg-primary hover:bg-primary/90' 
                            : 'hover:bg-primary/10 hover:text-primary'
                        }`}
                        onClick={() => toggleRegion(region)}
                      >
                        {region}
                        {formData.operatingRegions.includes(region) && (
                          <CheckCircle2 className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Terms */}
            {step === 4 && (
              <>
                <div className="rounded-lg bg-accent/10 p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-accent" />
                    <span className="font-semibold text-foreground">Delivery Services Subscription</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    As a Delivery Services partner, you will use our credit-based payment system. 
                    Credits are used to accept delivery jobs, and you earn revenue from completed deliveries.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Checkbox 
                      id="terms" 
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => updateFormData('termsAccepted', checked === true)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="terms" className="cursor-pointer font-medium">
                        Terms of Service *
                      </Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Partner Agreement</a>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Checkbox 
                      id="insurance" 
                      checked={formData.insuranceAccepted}
                      onCheckedChange={(checked) => updateFormData('insuranceAccepted', checked === true)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="insurance" className="cursor-pointer font-medium">
                        Insurance & Liability *
                      </Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        I understand the insurance coverage terms and my liability responsibilities for goods in transit.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Checkbox 
                      id="background" 
                      checked={formData.backgroundCheckAccepted}
                      onCheckedChange={(checked) => updateFormData('backgroundCheckAccepted', checked === true)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="background" className="cursor-pointer font-medium">
                        Background Check Consent *
                      </Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        I consent to a background verification check to ensure platform safety.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Your application will be reviewed within 2-3 business days. We&apos;ll contact you via email and phone for verification.
                  </p>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setStep((s) => (s - 1) as Step)}
                disabled={step === 1}
              >
                Back
              </Button>
              
              {step < 4 ? (
                <Button 
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  disabled={!canProceed()}
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="min-w-32"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
