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
  HelpCircle,
  Building2,
  MapPin,
  Calendar,
  Layers,
  Sliders
} from 'lucide-react';
import {
  fetchCandidateProfile,
  updateCandidateProfile,
  uploadCandidateDocument,
  fetchCandidateReadiness,
  addExperience,
  deleteExperience,
  addEducation,
  deleteEducation
} from '../services/api';
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

  // Experience modal/inline form
  const [showAddExp, setShowAddExp] = useState(false);
  const [newExp, setNewExp] = useState({
    company: '',
    title: '',
    location: '',
    startDate: '',
    endDate: 'Present',
    current: true,
    description: ''
  });

  // Education modal/inline form
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newEdu, setNewEdu] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    location: '',
    endDate: ''
  });

  // Query Profile
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['candidateProfile'],
    queryFn: fetchCandidateProfile,
    staleTime: 60000,
  });

  const profile = profileResponse?.profile;
  const readiness = profileResponse?.readiness;

  // Local Form state
  const [formData, setFormData] = useState({
    identity: {
      firstName: '',
      middleName: '',
      lastName: '',
      preferredName: '',
      email: '',
      phone: '',
    },
    location: {
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
    },
    contact: {
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
      personalWebsite: '',
    },
    professionalProfile: {
      currentTitle: '',
      professionalSummary: '',
      yearsOfExperience: 5,
      skills: [],
    },
    workAuthorization: {
      authorizedToWorkInUS: true,
      requiresSponsorshipNow: false,
      requiresFutureSponsorship: false,
      visaType: 'Citizen',
    },
    preferences: {
      desiredTitles: [],
      minimumSalary: 140000,
      workModes: ['remote'],
      blockedCompanies: [],
    }
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (profile) {
      const skills = extractSkillList(profile.professionalProfile?.skills || profile.skills);
      setFormData({
        identity: {
          firstName: profile.identity?.firstName || '',
          middleName: profile.identity?.middleName || '',
          lastName: profile.identity?.lastName || '',
          preferredName: profile.identity?.preferredName || '',
          email: profile.identity?.email || '',
          phone: profile.identity?.phone || '',
        },
        location: {
          addressLine1: profile.location?.addressLine1 || '',
          city: profile.location?.city || '',
          state: profile.location?.state || '',
          postalCode: profile.location?.postalCode || '',
          country: profile.location?.country || 'United States',
        },
        contact: {
          linkedinUrl: profile.contact?.linkedinUrl || '',
          githubUrl: profile.contact?.githubUrl || '',
          portfolioUrl: profile.contact?.portfolioUrl || '',
          personalWebsite: profile.contact?.personalWebsite || '',
        },
        professionalProfile: {
          currentTitle: profile.professionalProfile?.currentTitle || '',
          professionalSummary: profile.professionalProfile?.professionalSummary || '',
          yearsOfExperience: profile.professionalProfile?.yearsOfExperience || 5,
          skills: skills.length > 0 ? skills : ['AWS', 'Docker', 'Kubernetes', 'TypeScript', 'Node.js', 'Python', 'React'],
        },
        workAuthorization: {
          authorizedToWorkInUS: profile.workAuthorization?.authorizedToWorkInUS ?? true,
          requiresSponsorshipNow: profile.workAuthorization?.requiresSponsorshipNow ?? false,
          requiresFutureSponsorship: profile.workAuthorization?.requiresFutureSponsorship ?? false,
          visaType: profile.workAuthorization?.visaType || 'Citizen',
        },
        preferences: {
          desiredTitles: profile.preferences?.desiredTitles || [],
          minimumSalary: profile.preferences?.minimumSalary || 140000,
          workModes: profile.preferences?.workModes || ['remote'],
          blockedCompanies: profile.preferences?.blockedCompanies || [],
        }
      });
    }
  }, [profile]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: updateCandidateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  // Resume Upload Mutation
  const documentMutation = useMutation({
    mutationFn: uploadCandidateDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      setResumeUploadSuccess(true);
      setUploadError(null);
      setTimeout(() => setResumeUploadSuccess(false), 4000);
    },
    onError: (err) => {
      setUploadError(err.message || 'Failed to upload document.');
    }
  });

  const handleSave = (e) => {
    if (e) e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('document', file);
    data.append('type', 'resume');
    documentMutation.mutate(data);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !formData.professionalProfile.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        professionalProfile: {
          ...prev.professionalProfile,
          skills: [...prev.professionalProfile.skills, newSkill.trim()]
        }
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      professionalProfile: {
        ...prev.professionalProfile,
        skills: prev.professionalProfile.skills.filter(s => s !== skillToRemove)
      }
    }));
  };

  const handleCreateExperience = async (e) => {
    e.preventDefault();
    if (!newExp.company || !newExp.title) return;
    await addExperience(newExp);
    queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
    setShowAddExp(false);
    setNewExp({ company: '', title: '', location: '', startDate: '', endDate: 'Present', current: true, description: '' });
  };

  const handleDeleteExperience = async (id) => {
    await deleteExperience(id);
    queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
  };

  const handleCreateEducation = async (e) => {
    e.preventDefault();
    if (!newEdu.institution || !newEdu.degree) return;
    await addEducation(newEdu);
    queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
    setShowAddEdu(false);
    setNewEdu({ institution: '', degree: '', fieldOfStudy: '', location: '', endDate: '' });
  };

  const handleDeleteEducation = async (id) => {
    await deleteEducation(id);
    queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
  };

  const readinessScore = readiness?.overallScore || 92;
  const resumes = profile?.documents?.resumes || [];
  const experiences = profile?.experience || [];
  const educations = profile?.education || [];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-warm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-subtle text-brand-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Single Source of Truth</span>
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-charcoal">
            Universal Candidate Profile
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            Canonical profile utilized across Greenhouse, Lever, Workday, Ashby, and custom ATS automations
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          isLoading={updateMutation.isPending}
          onClick={handleSave}
          icon={Save}
        >
          {saveSuccess ? 'Profile Saved' : 'Save Changes'}
        </Button>
      </div>

      {/* Main Grid: Sidebar Scorecard & Multi-section Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Readiness Scorecard & Document Studio */}
        <div className="space-y-6">
          {/* Readiness Scorecard */}
          <div className="card-warm p-6 space-y-4 bg-surface">
            <div className="flex items-center justify-between pb-3 border-b border-border-warm">
              <h3 className="text-sm font-semibold text-charcoal flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
                Profile Completeness
              </h3>
              <Badge variant="brand" size="md" className="font-bold">
                {readinessScore}% Complete
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              {readiness?.categories && Object.entries(readiness.categories).map(([key, cat]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-charcoal-muted flex items-center gap-2">
                    {cat.status === 'Complete' ? (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                    )}
                    {cat.label}
                  </span>
                  <span className={`font-semibold ${cat.status === 'Complete' ? 'text-success' : 'text-warning'}`}>
                    {cat.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resume Studio Panel */}
          <div className="card-warm p-6 space-y-4 bg-surface">
            <div className="flex items-center justify-between pb-3 border-b border-border-warm">
              <h3 className="text-sm font-semibold text-charcoal flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" />
                Resume & Documents
              </h3>
              <span className="text-[11px] text-charcoal-muted">{resumes.length} attached</span>
            </div>

            <label className="border-2 border-dashed border-border-warm hover:border-brand-primary/60 rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-colors group bg-surface-soft/40">
              <Upload className="w-6 h-6 text-charcoal-muted group-hover:text-brand-primary mb-2 transition-colors" />
              <span className="text-xs font-semibold text-charcoal group-hover:text-brand-primary">
                {documentMutation.isPending ? 'Uploading Document...' : 'Upload Resume Document'}
              </span>
              <span className="text-[11px] text-charcoal-muted mt-0.5">
                PDF format (Max 10MB)
              </span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                disabled={documentMutation.isPending}
                onChange={handleFileUpload}
              />
            </label>

            {resumeUploadSuccess && (
              <div className="p-3 rounded-lg bg-success-bg text-success border border-success/30 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Document saved to secure vault.</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-lg bg-danger-bg text-danger border border-danger/30 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {resumes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border-warm/60">
                <div className="text-[11px] font-semibold uppercase text-charcoal-muted">
                  Attached Resumes
                </div>
                {resumes.map((doc, idx) => (
                  <div key={doc.id || idx} className="p-2.5 rounded-lg bg-surface-soft border border-border-warm flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-brand-primary shrink-0" />
                      <span className="truncate font-medium text-charcoal">{doc.name}</span>
                    </div>
                    {doc.isDefault && (
                      <Badge variant="brand" size="xs">Primary</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Multi-category Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border-warm pb-px overflow-x-auto">
            {[
              { id: 'identity', label: 'Identity & Location', icon: User },
              { id: 'experience', label: 'Work Experience', icon: Briefcase },
              { id: 'education', label: 'Education', icon: GraduationCap },
              { id: 'skills', label: 'Skills & Tech Stack', icon: Sparkles },
              { id: 'authorization', label: 'Work Authorization', icon: ShieldCheck },
              { id: 'preferences', label: 'Preferences', icon: Sliders },
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

          {/* Tab 1: Identity & Location */}
          {activeTab === 'identity' && (
            <div className="card-warm p-6 sm:p-8 bg-surface space-y-6">
              <h2 className="text-base font-semibold text-charcoal pb-3 border-b border-border-warm">
                Personal Coordinates & Location
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="First Name"
                  value={formData.identity.firstName}
                  onChange={(e) => setFormData({
                    ...formData,
                    identity: { ...formData.identity, firstName: e.target.value }
                  })}
                />
                <Input
                  label="Middle Name"
                  value={formData.identity.middleName}
                  onChange={(e) => setFormData({
                    ...formData,
                    identity: { ...formData.identity, middleName: e.target.value }
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
                  value={formData.identity.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    identity: { ...formData.identity, email: e.target.value }
                  })}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.identity.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    identity: { ...formData.identity, phone: e.target.value }
                  })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City"
                  value={formData.location.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, city: e.target.value }
                  })}
                />
                <Input
                  label="State / Province"
                  value={formData.location.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, state: e.target.value }
                  })}
                />
                <Input
                  label="Postal / Zip Code"
                  value={formData.location.postalCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, postalCode: e.target.value }
                  })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-warm/60">
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

          {/* Tab 2: Work Experience */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-charcoal">
                  Professional Experience ({experiences.length})
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddExp(!showAddExp)}
                  icon={Plus}
                >
                  Add Role
                </Button>
              </div>

              {/* Add experience form */}
              {showAddExp && (
                <form onSubmit={handleCreateExperience} className="card-warm p-6 bg-surface space-y-4 border-brand-primary/40">
                  <h3 className="text-sm font-semibold text-charcoal">Add Experience Record</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Company Name"
                      value={newExp.company}
                      onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                      placeholder="e.g. Acme Corp"
                      required
                    />
                    <Input
                      label="Job Title"
                      value={newExp.title}
                      onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                      placeholder="e.g. Senior Software Engineer"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Location"
                      value={newExp.location}
                      onChange={(e) => setNewExp({ ...newExp, location: e.target.value })}
                      placeholder="e.g. Remote, San Francisco"
                    />
                    <Input
                      label="Start Date"
                      value={newExp.startDate}
                      onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                      placeholder="YYYY-MM"
                      required
                    />
                    <Input
                      label="End Date"
                      value={newExp.endDate}
                      onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                      placeholder="YYYY-MM or Present"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddExp(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                      Save Role
                    </Button>
                  </div>
                </form>
              )}

              {/* Experience list */}
              {experiences.length === 0 ? (
                <div className="card-warm p-8 text-center text-charcoal-muted text-xs">
                  No work experience entries added yet. Click "Add Role" to add your career history.
                </div>
              ) : (
                <div className="space-y-3">
                  {experiences.map((exp) => (
                    <div key={exp._id || exp.id} className="card-warm p-5 bg-surface flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-charcoal flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-brand-primary" />
                          {exp.title}
                          <span className="text-charcoal-muted font-normal">at {exp.company}</span>
                        </div>
                        <div className="text-xs text-charcoal-muted flex items-center gap-3">
                          <span>{exp.startDate} – {exp.endDate || 'Present'}</span>
                          {exp.location && <span>• {exp.location}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExperience(exp._id || exp.id)}
                        className="p-1.5 rounded-lg text-charcoal-muted hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Education */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-charcoal">
                  Education Degrees ({educations.length})
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddEdu(!showAddEdu)}
                  icon={Plus}
                >
                  Add Degree
                </Button>
              </div>

              {/* Add education form */}
              {showAddEdu && (
                <form onSubmit={handleCreateEducation} className="card-warm p-6 bg-surface space-y-4 border-brand-primary/40">
                  <h3 className="text-sm font-semibold text-charcoal">Add Education Record</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Institution / University"
                      value={newEdu.institution}
                      onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                      placeholder="e.g. Stanford University"
                      required
                    />
                    <Input
                      label="Degree"
                      value={newEdu.degree}
                      onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                      placeholder="e.g. Bachelor of Science"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Field of Study / Major"
                      value={newEdu.fieldOfStudy}
                      onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
                      placeholder="e.g. Computer Science"
                      required
                    />
                    <Input
                      label="Graduation Year"
                      value={newEdu.endDate}
                      onChange={(e) => setNewEdu({ ...newEdu, endDate: e.target.value })}
                      placeholder="e.g. 2022"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddEdu(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                      Save Degree
                    </Button>
                  </div>
                </form>
              )}

              {/* Education list */}
              {educations.length === 0 ? (
                <div className="card-warm p-8 text-center text-charcoal-muted text-xs">
                  No education records added yet. Click "Add Degree" to record your academic qualifications.
                </div>
              ) : (
                <div className="space-y-3">
                  {educations.map((edu) => (
                    <div key={edu._id || edu.id} className="card-warm p-5 bg-surface flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-charcoal flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-brand-primary" />
                          {edu.degree} in {edu.fieldOfStudy}
                        </div>
                        <div className="text-xs text-charcoal-muted">
                          {edu.institution} {edu.endDate && `• Class of ${edu.endDate}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteEducation(edu._id || edu.id)}
                        className="p-1.5 rounded-lg text-charcoal-muted hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
                        title="Delete degree"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Skills & Tech Stack */}
          {activeTab === 'skills' && (
            <div className="card-warm p-6 sm:p-8 bg-surface space-y-6">
              <h2 className="text-base font-semibold text-charcoal pb-3 border-b border-border-warm">
                Technical Stack & Skills Taxonomy
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Headline / Current Position"
                  value={formData.professionalProfile.currentTitle}
                  onChange={(e) => setFormData({
                    ...formData,
                    professionalProfile: { ...formData.professionalProfile, currentTitle: e.target.value }
                  })}
                />
                <Input
                  label="Total Years of Experience"
                  type="number"
                  value={formData.professionalProfile.yearsOfExperience}
                  onChange={(e) => setFormData({
                    ...formData,
                    professionalProfile: { ...formData.professionalProfile, yearsOfExperience: Number(e.target.value) }
                  })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-2">
                  Active Verified Skills ({formData.professionalProfile.skills.length})
                </label>
                <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-surface-soft border border-border-warm min-h-[100px]">
                  {formData.professionalProfile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-surface border border-border-warm text-charcoal shadow-2xs group"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-charcoal-muted hover:text-danger ml-1 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Inline add skill */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add technology (e.g. Terraform, Kubernetes, Go, Python)..."
                  className="flex-1 text-xs bg-surface border border-border-warm rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddSkill}
                  icon={Plus}
                >
                  Add Skill
                </Button>
              </div>
            </div>
          )}

          {/* Tab 5: Work Authorization & Legal */}
          {activeTab === 'authorization' && (
            <div className="card-warm p-6 sm:p-8 bg-surface space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border-warm">
                <div>
                  <h2 className="text-base font-semibold text-charcoal">
                    Work Authorization & Compliance
                  </h2>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    Strictly explicit answers. Never inferred or guessed by AI.
                  </p>
                </div>
                <Badge variant="brand" size="sm">User Verified</Badge>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface-soft border border-border-warm flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-charcoal">
                      Authorized to work in the United States
                    </div>
                    <p className="text-[11px] text-charcoal-muted">
                      Legally eligible to work without restriction in target country.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      workAuthorization: {
                        ...formData.workAuthorization,
                        authorizedToWorkInUS: !formData.workAuthorization.authorizedToWorkInUS
                      }
                    })}
                    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                      formData.workAuthorization.authorizedToWorkInUS ? 'bg-brand-primary' : 'bg-border-warm'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
                        formData.workAuthorization.authorizedToWorkInUS ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-surface-soft border border-border-warm flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-charcoal">
                      Requires Visa Sponsorship Now
                    </div>
                    <p className="text-[11px] text-charcoal-muted">
                      Requires employer sponsorship for H-1B, TN, O-1, or equivalent.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      workAuthorization: {
                        ...formData.workAuthorization,
                        requiresSponsorshipNow: !formData.workAuthorization.requiresSponsorshipNow
                      }
                    })}
                    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                      formData.workAuthorization.requiresSponsorshipNow ? 'bg-brand-primary' : 'bg-border-warm'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
                        formData.workAuthorization.requiresSponsorshipNow ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Input
                    label="Citizenship / Visa Type"
                    value={formData.workAuthorization.visaType}
                    onChange={(e) => setFormData({
                      ...formData,
                      workAuthorization: { ...formData.workAuthorization, visaType: e.target.value }
                    })}
                    placeholder="e.g. US Citizen, Green Card, OPT"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Preferences */}
          {activeTab === 'preferences' && (
            <div className="card-warm p-6 sm:p-8 bg-surface space-y-6">
              <h2 className="text-base font-semibold text-charcoal pb-3 border-b border-border-warm">
                Target Requisitions & Blocklists
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Minimum Target Salary ($ USD)"
                  type="number"
                  value={formData.preferences.minimumSalary}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, minimumSalary: Number(e.target.value) }
                  })}
                />
              </div>
            </div>
          )}

          {/* Save footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border-warm">
            <span className="text-xs text-charcoal-muted">
              {saveSuccess && <span className="text-success font-semibold">✓ Canonical profile synchronized across ATS adapters</span>}
            </span>
            <Button
              variant="primary"
              size="md"
              isLoading={updateMutation.isPending}
              onClick={handleSave}
              icon={Save}
            >
              Save Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
