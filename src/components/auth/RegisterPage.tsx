import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FssaiVerificationResult, UserRole } from '../../types';

const MAX_CERTIFICATE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_CERTIFICATE_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_CERTIFICATE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export const RegisterPage: React.FC = () => {
  const { currentUser, registerUser, setActiveView } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('donor');

  // Form fields
  const [orgName, setOrgName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [fssai, setFssai] = useState('');
  const [gstin, setGstin] = useState('');
  const [mealsRequired, setMealsRequired] = useState(100);
  const [facilityType, setFacilityType] = useState('Compost Facility');
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredName, setRegisteredName] = useState('Green Leaf Bistro');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const certificateInputRef = useRef<HTMLInputElement>(null);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setTimeout(() => {
      setStep(2);
    }, 250);
  };

  const validateCertificateFile = (file: File): string | null => {
    const lowerName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_CERTIFICATE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    // Accept if MIME type is valid OR extension is valid (allow for browser MIME type variations)
    if (!ALLOWED_CERTIFICATE_TYPES.has(file.type) && !hasValidExtension) {
      return 'Please upload a valid PDF, JPG, JPEG, or PNG certificate.';
    }
    if (file.size <= 0) {
      return 'The selected certificate file is empty.';
    }
    if (file.size > MAX_CERTIFICATE_SIZE_BYTES) {
      return 'Certificate file is too large. Maximum file size is 10MB.';
    }
    return null;
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0] || null;
    if (!file) {
      setCertificateFile(null);
      return;
    }

    const validationError = validateCertificateFile(file);
    if (validationError) {
      setCertificateFile(null);
      setErrorMsg(validationError);
      return;
    }

    setCertificateFile(file);
  };

  const verifyCertificate = async (): Promise<FssaiVerificationResult> => {
    if (!certificateFile) {
      throw new Error('Please upload a FSSAI certificate for donor verification.');
    }

    const validationError = validateCertificateFile(certificateFile);
    if (validationError) throw new Error(validationError);

    const formData = new FormData();
    formData.append('certificate', certificateFile);
    formData.append('organizationName', orgName.trim());
    formData.append('fssaiNumber', fssai.trim());

    const response = await fetch('/api/verify-fssai', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => null) as FssaiVerificationResult | { error?: string } | null;

    if (!response.ok) {
      throw new Error(data && 'error' in data && data.error ? data.error : 'FSSAI verification failed.');
    }

    if (!data || !('verificationStatus' in data)) {
      throw new Error('FSSAI verification returned an invalid response.');
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');

    // Validation
    if (!orgName.trim() || !contactPerson.trim() || !email.trim() || !address.trim()) {
      setErrorMsg('Please fill in all required fields (Organization Name, Contact, Email, Address).');
      return;
    }

    if (selectedRole === 'donor' && !fssai.trim()) {
      setErrorMsg('Please enter your FSSAI number for donor registration.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fssaiVerification =
  selectedRole === 'donor'
    ? await verifyCertificate()
    : undefined;

await registerUser({
  name: orgName.trim(),
  role: selectedRole,
  email: email.trim(),
  phone: phone || '+91',
  address: address.trim(),
  contactPerson: contactPerson.trim(),

  fssai: selectedRole === 'donor' ? fssai.trim() : undefined,
  gstin: selectedRole === 'donor' ? gstin.trim() : undefined,

  location: {
    lat: 40.73,
    lng: -73.99,
    addressText: address.trim(),
  },

  dailyMealsRequired:
    selectedRole === 'receiver'
      ? mealsRequired
      : undefined,

  facilityType:
    selectedRole === 'waste_processor'
      ? facilityType
      : undefined,

  canCollect:
    selectedRole === 'receiver'
      ? 'Daily Pickup'
      : undefined,

  capacityTons:
    selectedRole === 'waste_processor'
      ? 150
      : undefined,

  fssaiVerification,
});
      setRegisteredName(orgName);
      setStep(3);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    setActiveView('dashboard');
  };

  return (
    <main className="pt-32 pb-section-gap px-container-padding max-w-5xl mx-auto min-h-[85vh]">
      {/* Registration Progress Header */}
      <div className="text-center mb-12">
        <h1 className="font-display-lg text-display-lg text-primary mb-4">Create your account</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Join the mission to recover food and restore hope. Your contribution helps build a sustainable future.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="flex justify-between items-center max-w-md mx-auto mb-16 relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-outline-variant -z-0"></div>

        {/* Step 1 Indicator */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step === 1
                ? 'bg-primary text-white ring-4 ring-secondary-container'
                : 'bg-secondary text-white'
            }`}
          >
            {step > 1 ? <span className="material-symbols-outlined text-sm">check</span> : 1}
          </div>
          <span
            className={`font-label-md text-label-md ${
              step === 1 ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}
          >
            Role Selection
          </span>
        </div>

        {/* Step 2 Indicator */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step === 2
                ? 'bg-primary text-white ring-4 ring-secondary-container'
                : step > 2
                ? 'bg-secondary text-white'
                : 'bg-surface-container-highest text-on-surface-variant'
            }`}
          >
            {step > 2 ? <span className="material-symbols-outlined text-sm">check</span> : 2}
          </div>
          <span
            className={`font-label-md text-label-md ${
              step === 2 ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}
          >
            Details
          </span>
        </div>

        {/* Step 3 Indicator */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step === 3
                ? 'bg-primary text-white ring-4 ring-secondary-container'
                : 'bg-surface-container-highest text-on-surface-variant'
            }`}
          >
            3
          </div>
          <span
            className={`font-label-md text-label-md ${
              step === 3 ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}
          >
            Verification
          </span>
        </div>
      </div>

      {/* Step 1: Role Selection */}
      {step === 1 && (
        <section className="animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Donor Card */}
            <div
              onClick={() => handleSelectRole('donor')}
              className={`role-card group cursor-pointer bg-white p-8 rounded-xl shadow-stripe card-lift transition-all flex flex-col items-center text-center border-2 ${
                selectedRole === 'donor' ? 'border-secondary bg-secondary-container/10' : 'border-transparent'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">restaurant</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-2">Donor</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Restaurants, hotels, or supermarkets with surplus food.
              </p>
              <div className="mt-6 font-label-md text-label-md text-secondary group-hover:underline transition-all">
                Select Role →
              </div>
            </div>

            {/* Receiver Card */}
            <div
              onClick={() => handleSelectRole('receiver')}
              className={`role-card group cursor-pointer bg-white p-8 rounded-xl shadow-stripe card-lift transition-all flex flex-col items-center text-center border-2 ${
                selectedRole === 'receiver' ? 'border-secondary bg-secondary-container/10' : 'border-transparent'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">volunteer_activism</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-2">Receiver</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                NGOs, shelters, or community kitchens serving those in need.
              </p>
              <div className="mt-6 font-label-md text-label-md text-secondary group-hover:underline transition-all">
                Select Role →
              </div>
            </div>

            {/* Waste Processor Card */}
            <div
              onClick={() => handleSelectRole('waste_processor')}
              className={`role-card group cursor-pointer bg-white p-8 rounded-xl shadow-stripe card-lift transition-all flex flex-col items-center text-center border-2 ${
                selectedRole === 'waste_processor'
                  ? 'border-secondary bg-secondary-container/10'
                  : 'border-transparent'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">recycling</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-2">Waste Processor</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Biogas plants or composting units for non-edible waste.
              </p>
              <div className="mt-6 font-label-md text-label-md text-secondary group-hover:underline transition-all">
                Select Role →
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 2: Role-Specific Form */}
      {step === 2 && (
        <section className="animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-white rounded-xl shadow-stripe p-8 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-outline-variant">
              <h2 className="font-headline-lg text-headline-lg text-primary capitalize">
                {selectedRole.replace('_', ' ')} Details
              </h2>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-on-surface-variant hover:text-primary flex items-center gap-1 font-label-md text-label-md"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span> Change Role
              </button>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-error">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-stack-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="rounded-lg border-outline-variant focus:border-secondary focus:ring-secondary p-3 bg-surface-bright"
                    placeholder="e.g. Green Leaf Bistro"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="rounded-lg border-outline-variant focus:border-secondary focus:ring-secondary p-3 bg-surface-bright"
                    placeholder="Full Name"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-lg border-outline-variant focus:border-secondary focus:ring-secondary p-3 bg-surface-bright"
                    placeholder="+91"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border-outline-variant focus:border-secondary focus:ring-secondary p-3 bg-surface-bright"
                    placeholder="contact@organization.com"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">
                    Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="rounded-lg border-outline-variant focus:border-secondary focus:ring-secondary p-3 bg-surface-bright"
                    placeholder="Full physical address for pickup coordination"
                  />
                </div>

                {selectedRole === 'donor' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-md text-label-md text-on-surface-variant">
                        FSSAI Number
                      </label>
                      <input
                        type="text"
                        value={fssai}
                        onChange={(e) => setFssai(e.target.value)}
                        className="rounded-lg border-outline-variant focus:border-secondary focus:ring-secondary p-3 bg-surface-bright"
                        placeholder="14-digit license number"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-md text-label-md text-on-surface-variant">
                        GSTIN
                      </label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        className="rounded-lg border-outline-variant focus:border-secondary focus:ring-secondary p-3 bg-surface-bright"
                        placeholder="GST Identification Number"
                      />
                    </div>
                  </>
                )}

                {selectedRole === 'receiver' && (
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md text-label-md text-on-surface-variant">
                      Daily Meals Required
                    </label>
                    <input
                      type="number"
                      value={mealsRequired}
                      onChange={(e) => setMealsRequired(parseInt(e.target.value) || 100)}
                      className="rounded-lg border-outline-variant focus:border-secondary focus:ring-secondary p-3 bg-surface-bright"
                      placeholder="e.g. 100"
                    />
                  </div>
                )}

                {selectedRole === 'waste_processor' && (
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md text-label-md text-on-surface-variant">
                      Facility Type
                    </label>
                    <select
                      value={facilityType}
                      onChange={(e) => setFacilityType(e.target.value)}
                      className="rounded-lg border-outline-variant focus:border-secondary focus:ring-secondary p-3 bg-surface-bright"
                    >
                      <option value="Compost Facility">Compost Facility</option>
                      <option value="Biogas Plant">Biogas Plant</option>
                      <option value="Industrial Anaerobic Digester">Industrial Anaerobic Digester</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Government Certificate Upload Box */}
              <div className="mt-4 flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">
                  Government Certificate (PDF/JPG) — Automated Verification Enabled
                </label>
                <div
                  onClick={() => certificateInputRef.current?.click()}
                  className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center bg-surface-bright hover:border-secondary transition-colors cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-secondary mb-2">
                    upload_file
                  </span>
                  <p className="font-body-md text-on-surface-variant">Click to upload or drag and drop</p>
                  <p className="font-caption text-caption text-outline">
                    Maximum file size 5MB • Instant automatic verification
                  </p>
                  <input
                    ref={certificateInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={handleCertificateChange}
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-on-primary font-label-md text-label-md px-10 py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md"
                >
                  {isSubmitting ? 'Complete Registration' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Step 3: Success State with Verified Badge */}
      {step === 3 && (
        <section className="animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-xl shadow-stripe p-12 max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-8 relative">
              <span className="material-symbols-outlined text-5xl text-on-secondary-container">
                check_circle
              </span>
              {/* Verified Badge Logic from Template */}
              <div className="absolute -bottom-2 -right-2 bg-white border border-outline-variant rounded-full px-3 py-1 flex items-center gap-1 shadow-sm">
                <span
                  className="material-symbols-outlined text-secondary text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span className="font-label-md text-[10px] uppercase tracking-tighter text-secondary font-bold">
                  {currentUser?.verified ? 'Verified = True' : 'Verification Pending'}
                </span>
              </div>
            </div>

            <h2 className="font-headline-lg text-headline-lg text-primary mb-2">
              {currentUser?.verified ? 'Application Received & Verified!' : 'Application Received!'}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
              Thank you, <span className="font-bold text-primary">{registeredName}</span>. Your account is
              {currentUser?.verified ? ' verified and ready' : ' ready with verification pending'}. Welcome to FoodBridge!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGoToDashboard}
                className="bg-primary text-on-primary font-label-md text-label-md px-8 py-3 rounded-lg hover:opacity-90 transition-all shadow-md"
              >
                Go to Dashboard ({selectedRole.replace('_', ' ').toUpperCase()})
              </button>
              <button
                onClick={() => setActiveView('map')}
                className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-8 py-3 rounded-lg hover:opacity-90 transition-all"
              >
                View Network Map
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};
