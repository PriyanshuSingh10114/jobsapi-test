import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile, uploadResume, fetchFieldRegistry, fetchATSReadiness } from '../services/api';
import { UNIVERSAL_FIELD_REGISTRY as LOCAL_REGISTRY } from '../config/universalFieldRegistry';
import { 
  User, MapPin, Link as LinkIcon, FileText, Briefcase, GraduationCap, 
  Award, FolderGit2, Code, Globe, Sliders, PieChart, Sparkles, BrainCircuit,
  CheckCircle, AlertCircle, Search, Upload, Shield, Lock, ChevronDown, ChevronRight
} from 'lucide-react';

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const SECTION_METADATA = [
  { id: 'identity', icon: User, title: 'Core Identity' },
  { id: 'contact', icon: User, title: 'Contact Information' },
  { id: 'location', icon: MapPin, title: 'Location & Address' },
  { id: 'authorization', icon: Globe, title: 'Work Auth & Defense' },
  { id: 'links', icon: LinkIcon, title: 'Profiles & Social Links' },
  { id: 'preferences', icon: Sliders, title: 'Comp & Preferences' },
  { id: 'demographics', icon: PieChart, title: 'US EEO & Demographics' },
  { id: 'assets', icon: FileText, title: 'Resume Documents' },
  { id: 'answerBank', icon: BrainCircuit, title: 'AI Answer Bank' }
];

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('identity');
  const [formData, setFormData] = useState({});
  const [saveStatus, setSaveStatus] = useState('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: profileRes, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile
  });

  const { data: registryRes } = useQuery({
    queryKey: ['registry'],
    queryFn: fetchFieldRegistry,
    staleTime: Infinity
  });

  const { data: readinessRes } = useQuery({
    queryKey: ['readiness'],
    queryFn: fetchATSReadiness
  });

  const registry = registryRes?.registry || LOCAL_REGISTRY;
  const readiness = readinessRes?.readiness || profileRes?.readiness || { overallScore: 0, atsBreakdown: {} };

  useEffect(() => {
    if (profileRes?.profile) {
      setFormData(profileRes.profile);
    }
  }, [profileRes]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      setSaveStatus('saved');
      if (res.profile) {
        setFormData(prev => ({
          ...prev,
          ...res.profile,
          identity: { ...(prev.identity || {}), ...(res.profile.identity || {}) },
          contact: { ...(prev.contact || {}), ...(res.profile.contact || {}) },
          location: { ...(prev.location || {}), ...(res.profile.location || {}) },
          authorization: { ...(prev.authorization || {}), ...(res.profile.authorization || {}) },
          compliance: { ...(prev.compliance || {}), ...(res.profile.compliance || {}) },
          demographics: { ...(prev.demographics || {}), ...(res.profile.demographics || {}) }
        }));
      }
      queryClient.invalidateQueries(['readiness']);
    },
    onError: () => setSaveStatus('error')
  });

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: (res) => {
      setSaveStatus('saved');
      if (res.profile) setFormData(res.profile);
      queryClient.invalidateQueries(['readiness']);
    },
    onError: () => setSaveStatus('error')
  });

  const debouncedSave = useCallback(
    debounce((data) => {
      setSaveStatus('saving');
      updateMutation.mutate(data);
    }, 1500),
    []
  );

  const handleFieldChange = (canonicalId, value) => {
    const parts = canonicalId.split('.');
    let updated = { ...formData };
    
    if (parts.length === 2) {
      const [sec, sub] = parts;
      updated[sec] = { ...(updated[sec] || {}), [sub]: value };
      setFormData(updated);
      setSaveStatus('saving');
      debouncedSave({ [sec]: updated[sec] });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSaveStatus('saving');
      const data = new FormData();
      data.append('resume', file);
      uploadMutation.mutate(data);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const renderField = (field) => {
    const parts = field.canonicalId.split('.');
    let currentValue = parts.length === 2 ? (formData[parts[0]]?.[parts[1]] ?? '') : '';
    if (!currentValue && parts[0] === 'identity' && formData.basicInfo) {
      currentValue = formData.basicInfo[parts[1]] ?? '';
    }
    if (!currentValue && parts[0] === 'contact' && formData.basicInfo) {
      currentValue = formData.basicInfo[parts[1]] ?? '';
    }

    return (
      <div key={field.canonicalId} className="mb-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            {field.displayName}
            {field.isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-1">
            {field.atsPlatforms?.map(ats => (
              <span key={ats} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">
                {ats}
              </span>
            ))}
          </div>
        </div>

        {field.description && <p className="text-xs text-slate-500 mb-2">{field.description}</p>}

        {field.inputType === 'select' ? (
          <select
            value={currentValue}
            onChange={(e) => {
              const val = field.dataType === 'boolean' ? e.target.value === 'true' : e.target.value;
              handleFieldChange(field.canonicalId, val);
            }}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Select Option --</option>
            {field.options?.map(opt => (
              <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
            ))}
          </select>
        ) : field.inputType === 'textarea' ? (
          <textarea
            value={currentValue}
            onChange={(e) => handleFieldChange(field.canonicalId, e.target.value)}
            rows={3}
            placeholder={field.exampleValue}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />
        ) : (
          <input
            type={field.inputType || 'text'}
            value={currentValue}
            onChange={(e) => handleFieldChange(field.canonicalId, e.target.value)}
            placeholder={field.exampleValue}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        )}
      </div>
    );
  };

  const renderSectionContent = () => {
    if (activeSection === 'assets') {
      return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Resume & Documents</h3>
          <p className="text-sm text-slate-500">Upload your primary PDF resume used for browser automation.</p>
          <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" id="resume-upload" />
          <label htmlFor="resume-upload" className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl cursor-pointer transition-colors bg-indigo-50/50">
            <Upload className="h-8 w-8 text-indigo-600 mb-2" />
            <span className="text-sm font-semibold text-slate-700">Click to upload Resume PDF</span>
          </label>

          {formData.assets?.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-bold text-slate-700">Uploaded Documents:</h4>
              {formData.assets.map((asset, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-medium text-slate-700">{asset.name}</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Verified PDF</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'answerBank') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 mb-4">Store reusable answers here. AI Question Engine uses these to fill open behavioral prompts dynamically.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-sm font-bold text-slate-800 block">Tell us about yourself</label>
            <textarea
              value={formData.answerBank?.tellUsAboutYourself || ''}
              onChange={(e) => handleFieldChange('answerBank.tellUsAboutYourself', e.target.value)}
              rows={3}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-sm font-bold text-slate-800 block">Biggest Professional Achievement</label>
            <textarea
              value={formData.answerBank?.biggestAchievement || ''}
              onChange={(e) => handleFieldChange('answerBank.biggestAchievement', e.target.value)}
              rows={3}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      );
    }

    const sectionFields = registry.filter(f => f.section === activeSection);
    const standardFields = sectionFields.filter(f => !f.shouldBeAdvanced);
    const advancedFields = sectionFields.filter(f => f.shouldBeAdvanced);

    return (
      <div className="space-y-4">
        {standardFields.map(renderField)}

        {advancedFields.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 mb-4"
            >
              {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {showAdvanced ? 'Hide Defense & Advanced Fields' : `Show Advanced & Security Fields (${advancedFields.length})`}
            </button>
            {showAdvanced && advancedFields.map(renderField)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 pt-4 pb-8">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800">Profile Studio</h2>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search registry..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {SECTION_METADATA.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {sec.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
        {/* Header with ATS Readiness */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-white z-10 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {SECTION_METADATA.find(s => s.id === activeSection)?.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Metadata-driven ATS registry inputs.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ATS Readiness</p>
                <p className="text-lg font-bold text-indigo-600">{readiness.overallScore || 0}%</p>
              </div>
              <div className="flex items-center gap-1.5">
                {Object.entries(readiness.atsBreakdown || {}).map(([ats, score]) => (
                  <div key={ats} className="text-center px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg" title={`${ats} Compatibility Score`}>
                    <p className="text-[9px] font-semibold text-slate-500">{ats}</p>
                    <p className={`text-xs font-bold ${score >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{score}%</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full ${
              saveStatus === 'saved' ? 'bg-emerald-50 text-emerald-600' : 
              saveStatus === 'saving' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
            }`}>
              {saveStatus === 'saved' ? <CheckCircle size={16} /> : 
               saveStatus === 'saving' ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : 
               <AlertCircle size={16} />}
              {saveStatus.charAt(0).toUpperCase() + saveStatus.slice(1)}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="max-w-3xl">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
