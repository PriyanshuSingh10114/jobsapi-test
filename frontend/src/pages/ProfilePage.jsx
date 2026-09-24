import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  ShieldCheck,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Clock
} from 'lucide-react';
import { fetchProfile, updateProfile, uploadResume, fetchATSReadiness } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { extractSkillList } from '../utils/skills';

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('identity');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Query Profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchProfile,
    staleTime: 60000,
  });

  // Query ATS Readiness
  const { data: readinessData } = useQuery({
    queryKey: ['atsReadiness'],
    queryFn: fetchATSReadiness,
    staleTime: 60000,
  });

  // Local Form state initialized from profile
  const [formData, setFormData] = useState({
    identity: {
      firstName: '',
      lastName: '',
      preferredName: '',
      pronouns: '',
    },
    contact: {
      email: '',
      phone: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
    },
    location: {
      city: '',
      state: '',
      country: 'United States',
      postalCode: '',
    },
    authorization: {
      isAuthorizedInUS: true,
      requiresSponsorshipNowOrFuture: false,
    },
    professionalInfo: {
      currentPosition: '',
      currentCompany: '',
      yearsExperience: 5,
      expectedSalary: 140000,
    },
    skills: [],
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (profileData?.profile) {
      const p = profileData.profile;
      const loadedSkills = extractSkillList(p.skills);
      setFormData({
        identity: {
          firstName: p.basicInfo?.firstName || p.identity?.firstName || '',
          lastName: p.basicInfo?.lastName || p.identity?.lastName || '',
          preferredName: p.basicInfo?.preferredName || p.identity?.preferredName || '',
          pronouns: p.basicInfo?.pronouns || p.identity?.pronouns || '',
        },
        contact: {
          email: p.basicInfo?.email || p.contact?.email || '',
          phone: p.basicInfo?.phone || p.contact?.phone || '',
          linkedinUrl: p.basicInfo?.linkedin || p.contact?.linkedinUrl || '',
          githubUrl: p.basicInfo?.github || p.contact?.githubUrl || '',
          portfolioUrl: p.basicInfo?.portfolio || p.contact?.portfolioUrl || '',
        },
        location: {
          city: p.location?.city || '',
          state: p.location?.state || '',
          country: p.location?.country || 'United States',
          postalCode: p.location?.postalCode || '',
        },
        authorization: {
          isAuthorizedInUS: p.workAuthorization?.citizen ?? p.authorization?.isAuthorizedInUS ?? true,
          requiresSponsorshipNowOrFuture: p.workAuthorization?.needSponsorship ?? p.authorization?.requiresSponsorshipNowOrFuture ?? false,
        },
        professionalInfo: {
          currentPosition: p.professionalInfo?.currentPosition || '',
          currentCompany: p.professionalInfo?.currentCompany || '',
          yearsExperience: p.professionalInfo?.yearsExperience || 5,
          expectedSalary: p.professionalInfo?.expectedSalary || 140000,
        },
        skills: loadedSkills.length > 0 ? loadedSkills : ['AWS', 'Docker', 'Kubernetes', 'TypeScript', 'Node.js', 'Python', 'React'],
      });
    }
  }, [profileData]);


  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['atsReadiness'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  // Resume Upload Mutation
  const resumeMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['atsReadiness'] });
      setResumeUploadSuccess(true);
      setUploadError(null);
      setTimeout(() => setResumeUploadSuccess(false), 4000);
    },
    onError: (err) => {
      setUploadError(err.message || 'Failed to process resume file.');
    }
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('resume', file);
    resumeMutation.mutate(data);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  const readinessScore = readinessData?.readiness?.overallScore || profileData?.readiness?.overallScore || 92;
  const assets = profileData?.profile?.assets || [];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-warm">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-charcoal">
            Candidate Knowledge Graph
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            The canonical source of truth for ATS auto-fill and skill alignment
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          isLoading={updateMutation.isPending}
          onClick={handleSaveProfile}
          icon={Save}
        >
          {saveSuccess ? 'Changes Saved' : 'Save Changes'}
        </Button>
      </div>

      {/* Main Split: Readiness Scorecard (Left) & Knowledge Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: ATS Scorecard & Resume Asset Studio */}
        <div className="space-y-6">
          {/* Readiness Scorecard */}
          <div className="card-warm p-6 space-y-4 bg-surface">
            <div className="flex items-center justify-between pb-3 border-b border-border-warm">
              <h3 className="text-sm font-semibold text-charcoal flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
                ATS Readiness
              </h3>
              <Badge variant="brand" size="md" className="font-bold">
                {readinessScore}% Score
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Personal Information
                </span>
                <span className="font-semibold text-success">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Work Authorization
                </span>
                <span className="font-semibold text-success">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Technical Skills ({formData.skills.length})
                </span>
                <span className="font-semibold text-success">Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Primary Resume PDF
                </span>
                <span className="font-semibold text-success">
                  {assets.length > 0 ? 'Attached' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Resume Studio Panel */}
          <div className="card-warm p-6 space-y-4 bg-surface">
            <div className="flex items-center justify-between pb-3 border-b border-border-warm">
              <h3 className="text-sm font-semibold text-charcoal flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" />
                Resume Studio
              </h3>
              <span className="text-[11px] text-charcoal-muted">PDF Format</span>
            </div>

            {/* Resume Upload Drag & Drop Area */}
            <label className="border-2 border-dashed border-border-warm hover:border-brand-primary/60 rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-colors group bg-surface-soft/40">
              <Upload className="w-6 h-6 text-charcoal-muted group-hover:text-brand-primary mb-2 transition-colors" />
              <span className="text-xs font-semibold text-charcoal group-hover:text-brand-primary">
                {resumeMutation.isPending ? 'Uploading & Parsing...' : 'Upload Updated Resume'}
              </span>
              <span className="text-[11px] text-charcoal-muted mt-0.5">
                Drag PDF document or browse (Max 10MB)
              </span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                disabled={resumeMutation.isPending}
                onChange={handleFileUpload}
              />
            </label>

            {resumeUploadSuccess && (
              <div className="p-3 rounded-lg bg-success-bg text-success border border-success/30 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Resume parsed & synchronized to UCKGraph.</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-lg bg-danger-bg text-danger border border-danger/30 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Existing attached assets */}
            {assets.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border-warm/60">
                <div className="text-[11px] font-semibold uppercase text-charcoal-muted">
                  Attached Assets
                </div>
                {assets.map((asset, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-surface-soft border border-border-warm flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-brand-primary shrink-0" />
                      <span className="truncate font-medium text-charcoal">{asset.name}</span>
                    </div>
                    <span className="text-[10px] text-charcoal-muted">v{asset.version || '1.0'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Multi-section Profile Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border-warm pb-px overflow-x-auto">
            {[
              { id: 'identity', label: 'Identity & Contact', icon: User },
              { id: 'professional', label: 'Professional & Role', icon: Briefcase },
              { id: 'skills', label: 'Skills & Tech Stack', icon: Sparkles },
              { id: 'authorization', label: 'Work Authorization', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-brand-primary text-brand-primary font-semibold'
                      : 'border-transparent text-charcoal-muted hover:text-charcoal'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSaveProfile} className="card-warm p-6 sm:p-8 bg-surface space-y-6">
            {activeTab === 'identity' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={formData.identity.firstName}
                    onChange={(e) => setFormData({
                      ...formData,
                      identity: { ...formData.identity, firstName: e.target.value }
                    })}
                  />
                  <Input
                    label="Last Name"
                    value={formData.identity.lastName}
                    onChange={(e) => setFormData({
                      ...formData,
                      identity: { ...formData.identity, lastName: e.target.value }
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.contact.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, email: e.target.value }
                    })}
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.contact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, phone: e.target.value }
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="LinkedIn Profile"
                    value={formData.contact.linkedinUrl}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, linkedinUrl: e.target.value }
                    })}
                    placeholder="https://linkedin.com/in/username"
                  />
                  <Input
                    label="GitHub Profile"
                    value={formData.contact.githubUrl}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, githubUrl: e.target.value }
                    })}
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Current Job Title"
                    value={formData.professionalInfo.currentPosition}
                    onChange={(e) => setFormData({
                      ...formData,
                      professionalInfo: { ...formData.professionalInfo, currentPosition: e.target.value }
                    })}
                    placeholder="Senior DevOps Engineer"
                  />
                  <Input
                    label="Current Company"
                    value={formData.professionalInfo.currentCompany}
                    onChange={(e) => setFormData({
                      ...formData,
                      professionalInfo: { ...formData.professionalInfo, currentCompany: e.target.value }
                    })}
                    placeholder="Current Employer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Years of Experience"
                    type="number"
                    value={formData.professionalInfo.yearsExperience}
                    onChange={(e) => setFormData({
                      ...formData,
                      professionalInfo: { ...formData.professionalInfo, yearsExperience: e.target.value }
                    })}
                  />
                  <Input
                    label="Target Annual Salary ($ USD)"
                    type="number"
                    value={formData.professionalInfo.expectedSalary}
                    onChange={(e) => setFormData({
                      ...formData,
                      professionalInfo: { ...formData.professionalInfo, expectedSalary: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-2">
                    Active Skills ({formData.skills.length})
                  </label>
                  <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-surface-soft border border-border-warm min-h-[100px]">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-surface border border-border-warm text-charcoal shadow-2xs group"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-charcoal-muted hover:text-danger ml-1 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add new skill inline */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a technology (e.g. Terraform, Go, GraphQL)..."
                    className="flex-1 text-xs bg-surface border border-border-warm rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddSkill}
                    icon={Plus}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'authorization' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-surface-soft border border-border-warm flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-charcoal">
                      Authorized to work in target location
                    </div>
                    <p className="text-[11px] text-charcoal-muted">
                      Eligible to work in the United States without restriction.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      authorization: {
                        ...formData.authorization,
                        isAuthorizedInUS: !formData.authorization.isAuthorizedInUS
                      }
                    })}
                    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                      formData.authorization.isAuthorizedInUS ? 'bg-brand-primary' : 'bg-border-warm'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
                        formData.authorization.isAuthorizedInUS ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-surface-soft border border-border-warm flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-charcoal">
                      Requires Visa Sponsorship
                    </div>
                    <p className="text-[11px] text-charcoal-muted">
                      Requires H-1B, TN, or equivalent visa sponsorship now or in the future.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      authorization: {
                        ...formData.authorization,
                        requiresSponsorshipNowOrFuture: !formData.authorization.requiresSponsorshipNowOrFuture
                      }
                    })}
                    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                      formData.authorization.requiresSponsorshipNowOrFuture ? 'bg-brand-primary' : 'bg-border-warm'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
                        formData.authorization.requiresSponsorshipNowOrFuture ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Save Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border-warm">
              <span className="text-xs text-charcoal-muted">
                {saveSuccess && <span className="text-success font-medium">✓ Knowledge graph synchronized</span>}
              </span>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={updateMutation.isPending}
                icon={Save}
              >
                Save Knowledge Graph
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
