import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile, uploadResume } from '../services/api';
import { 
  User, MapPin, Link as LinkIcon, FileText, Briefcase, GraduationCap, 
  Award, FolderGit2, Code, Globe, Sliders, PieChart, Sparkles, BrainCircuit,
  CheckCircle, AlertCircle, Search, Save, Upload, Plus, Trash2, ChevronDown, ChevronRight
} from 'lucide-react';

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const SECTIONS = [
  { id: 'basicInfo', icon: User, title: 'Basic Identity' },
  { id: 'location', icon: MapPin, title: 'Location' },
  { id: 'links', icon: LinkIcon, title: 'Professional Links' },
  { id: 'assets', icon: FileText, title: 'Resume Assets' },
  { id: 'professionalInfo', icon: Briefcase, title: 'Professional Info' },
  { id: 'education', icon: GraduationCap, title: 'Education' },
  { id: 'experience', icon: Briefcase, title: 'Experience' },
  { id: 'projects', icon: FolderGit2, title: 'Projects' },
  { id: 'skills', icon: Code, title: 'Skills' },
  { id: 'certifications', icon: Award, title: 'Certifications' },
  { id: 'workAuthorization', icon: Globe, title: 'Work Authorization' },
  { id: 'preferences', icon: Sliders, title: 'Preferences' },
  { id: 'demographic', icon: PieChart, title: 'Demographic' },
  { id: 'aiProfile', icon: Sparkles, title: 'AI Generated Profile' },
  { id: 'answerBank', icon: BrainCircuit, title: 'AI Answer Bank' }
];

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('basicInfo');
  const [formData, setFormData] = useState({});
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [completeness, setCompleteness] = useState({ overall: 0, missingFields: [] });
  const [searchQuery, setSearchQuery] = useState('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile
  });

  useEffect(() => {
    if (response?.profile) {
      setFormData(response.profile);
      if (response.completeness) {
        setCompleteness(response.completeness);
      }
    }
  }, [response]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      setSaveStatus('saved');
      if (res.profile) setFormData(res.profile);
      if (res.completeness) setCompleteness(res.completeness);
    },
    onError: () => setSaveStatus('error')
  });

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: (res) => {
      setSaveStatus('saved');
      if (res.profile) setFormData(res.profile);
    },
    onError: () => setSaveStatus('error')
  });

  // Autosave
  const debouncedSave = useCallback(
    debounce((data) => {
      setSaveStatus('saving');
      updateMutation.mutate(data);
    }, 1500),
    []
  );

  const handleChange = (section, field, value) => {
    const updated = {
      ...formData,
      [section]: {
        ...(formData[section] || {}),
        [field]: value
      }
    };
    setFormData(updated);
    setSaveStatus('saving');
    debouncedSave({ [section]: updated[section] });
  };

  const handleArrayChange = (section, index, field, value) => {
    const arr = [...(formData[section] || [])];
    arr[index] = { ...arr[index], [field]: value };
    const updated = { ...formData, [section]: arr };
    setFormData(updated);
    setSaveStatus('saving');
    debouncedSave({ [section]: arr });
  };

  const addArrayItem = (section, defaultItem) => {
    const arr = [...(formData[section] || []), defaultItem];
    const updated = { ...formData, [section]: arr };
    setFormData(updated);
    setSaveStatus('saving');
    debouncedSave({ [section]: arr });
  };

  const removeArrayItem = (section, index) => {
    const arr = [...(formData[section] || [])];
    arr.splice(index, 1);
    const updated = { ...formData, [section]: arr };
    setFormData(updated);
    setSaveStatus('saving');
    debouncedSave({ [section]: arr });
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const renderInput = (section, field, label, type = 'text', placeholder = '') => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={(formData[section] && formData[section][field]) || ''}
          onChange={(e) => handleChange(section, field, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none min-h-[100px]"
        />
      ) : type === 'checkbox' ? (
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            checked={(formData[section] && formData[section][field]) || false}
            onChange={(e) => handleChange(section, field, e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-slate-700">{label}</span>
        </div>
      ) : (
        <input
          type={type}
          value={(formData[section] && formData[section][field]) || ''}
          onChange={(e) => handleChange(section, field, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
        />
      )}
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'basicInfo':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput('basicInfo', 'firstName', 'First Name')}
            {renderInput('basicInfo', 'middleName', 'Middle Name')}
            {renderInput('basicInfo', 'lastName', 'Last Name')}
            {renderInput('basicInfo', 'preferredName', 'Preferred Name')}
            {renderInput('basicInfo', 'email', 'Email Address', 'email')}
            {renderInput('basicInfo', 'phone', 'Phone Number', 'tel')}
            {renderInput('basicInfo', 'profilePhoto', 'Profile Photo URL')}
          </div>
        );
      case 'location':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput('location', 'country', 'Current Country')}
            {renderInput('location', 'state', 'State / Province')}
            {renderInput('location', 'city', 'City')}
            {renderInput('location', 'zipCode', 'ZIP / Postal Code')}
            {renderInput('location', 'willingToRelocate', 'Willing to Relocate', 'checkbox')}
          </div>
        );
      case 'links':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput('links', 'linkedin', 'LinkedIn URL')}
            {renderInput('links', 'github', 'GitHub URL')}
            {renderInput('links', 'portfolio', 'Portfolio URL')}
            {renderInput('links', 'personalWebsite', 'Personal Website')}
          </div>
        );
      case 'professionalInfo':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput('professionalInfo', 'currentCompany', 'Current Company')}
            {renderInput('professionalInfo', 'currentPosition', 'Current Position')}
            {renderInput('professionalInfo', 'yearsExperience', 'Years of Experience', 'number')}
            {renderInput('professionalInfo', 'expectedSalary', 'Expected Salary')}
            {renderInput('professionalInfo', 'noticePeriod', 'Notice Period')}
          </div>
        );
      case 'assets':
        return (
          <div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Resume (PDF)</label>
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition">
                <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 font-medium">Click or drag file here to upload</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Stored Assets</h4>
              <div className="space-y-3">
                {formData.assets?.map((asset, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="text-primary-600 h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{asset.name}</p>
                        <p className="text-xs text-slate-500">ATS Score: {asset.atsScore}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!formData.assets || formData.assets.length === 0) && (
                  <p className="text-sm text-slate-500">No assets uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        );
      case 'answerBank':
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">Store reusable answers here. The AI will use these to answer custom questions on applications dynamically.</p>
            {renderInput('answerBank', 'tellUsAboutYourself', 'Tell us about yourself', 'textarea')}
            {renderInput('answerBank', 'whyThisCompany', 'Why do you want to work for this company?', 'textarea')}
            {renderInput('answerBank', 'biggestAchievement', 'What is your biggest professional achievement?', 'textarea')}
            {renderInput('answerBank', 'conflict', 'Describe a time you had a conflict at work and how you resolved it.', 'textarea')}
          </div>
        );
      case 'workAuthorization':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput('workAuthorization', 'country', 'Country of Authorization')}
            {renderInput('workAuthorization', 'citizen', 'Are you a citizen?', 'checkbox')}
            {renderInput('workAuthorization', 'needSponsorship', 'Do you require sponsorship?', 'checkbox')}
            {renderInput('workAuthorization', 'visaType', 'Visa Type (if applicable)')}
          </div>
        );
      default:
        return (
          <div className="text-center py-12 text-slate-500">
            <p>This section is currently being expanded.</p>
            <p className="text-sm mt-2">Check back soon for {SECTIONS.find(s => s.id === activeSection)?.title} settings.</p>
          </div>
        );
    }
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
              placeholder="Search sections..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {SECTIONS.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700 font-semibold border-r-4 border-primary-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                {section.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {SECTIONS.find(s => s.id === activeSection)?.title}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Changes are saved automatically.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completeness</p>
                <p className="text-lg font-bold text-primary-600">{completeness.overall}%</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="24" cy="24" r="20" className="stroke-slate-100" strokeWidth="4" fill="none" />
                  <circle cx="24" cy="24" r="20" className="stroke-primary-500 transition-all duration-1000" strokeWidth="4" fill="none" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * completeness.overall) / 100} />
                </svg>
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
