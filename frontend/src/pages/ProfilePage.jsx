import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile, uploadResume } from '../services/api';
import { User, Mail, Phone, Link as LinkIcon, FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        linkedin: profile.linkedin || '',
        portfolio: profile.portfolio || ''
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setSaveStatus({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
    },
    onError: (err) => {
      setSaveStatus({ type: 'error', message: err.message || 'Failed to update profile' });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setResumeFile(null);
      setSaveStatus({ type: 'success', message: 'Resume uploaded successfully!' });
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
    },
    onError: (err) => {
      setSaveStatus({ type: 'error', message: err.message || 'Failed to upload resume' });
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      const data = new FormData();
      data.append('resume', file);
      uploadMutation.mutate(data);
    } else if (file) {
      setSaveStatus({ type: 'error', message: 'Please select a valid PDF file.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Profile Studio</h1>
        <p className="text-slate-500">Manage your details and resume. This information will be used by the AI when you auto-apply for jobs.</p>
      </div>

      {saveStatus.message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${saveStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {saveStatus.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{saveStatus.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="md:col-span-2 space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4">Personal Details</h2>
          
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-slate-400" /></div>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Jane" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Developer" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-slate-400" /></div>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="jane@example.com" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-slate-400" /></div>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="(555) 123-4567" required />
                </div>
              </div>
            </div>

            <div className="space-y-5 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Web Profiles</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon className="h-4 w-4 text-slate-400" /></div>
                  <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="https://linkedin.com/in/jane-dev" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Portfolio / Personal Website</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon className="h-4 w-4 text-slate-400" /></div>
                  <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="https://janedev.com" />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-70">
                {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Resume Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4 flex items-center gap-2">
              <FileText size={20} className="text-primary-600"/> Resume
            </h2>
            
            {profile?.resumePath ? (
              <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <FileText className="text-primary-600 shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm break-all">
                    {profile.resumePath.split(/[\\/]/).pop()}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Ready for Auto-Apply</p>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl text-sm font-medium">
                No resume uploaded. Auto-Apply may fail.
              </div>
            )}

            <div className="relative">
              <input 
                type="file" 
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${uploadMutation.isPending ? 'border-slate-300 bg-slate-50' : 'border-primary-200 bg-primary-50/50 hover:bg-primary-50 group'}`}>
                {uploadMutation.isPending ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    <span className="text-sm font-medium text-slate-600">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-primary-600">
                    <Upload size={32} className="mb-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="font-semibold mb-1">Click or drag PDF here</span>
                    <span className="text-xs opacity-70">Max size: 5MB</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
