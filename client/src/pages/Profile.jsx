import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { ROLES, EXPERIENCE_LEVELS } from '../utils/constants';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlinePencil, HiOutlineX, HiOutlinePlus } from 'react-icons/hi';

export default function Profile() {
  const { user, updateProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    bio: '',
    targetRole: '',
    experienceLevel: '',
    skills: [],
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        targetRole: user.targetRole || '',
        experienceLevel: user.experienceLevel || '',
        skills: user.skills || [],
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    if (!skill) return;
    if (form.skills.includes(skill)) return toast.error('Skill already added');
    if (form.skills.length >= 15) return toast.error('Max 15 skills');
    setForm({ ...form, skills: [...form.skills, skill] });
    setNewSkill('');
  };

  const removeSkill = (skillToRemove) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skillToRemove) });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-dark-border">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{user?.name}</p>
            <p className="text-text-muted text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
            <div className="relative">
              <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all resize-none"
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-text-muted mt-1">{form.bio.length}/500</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Target Role</label>
            <select
              value={form.targetRole}
              onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
              className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
            >
              <option value="">Select a role</option>
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>{role.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Experience Level</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setForm({ ...form, experienceLevel: level.id })}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    form.experienceLevel === level.id
                      ? 'border-accent-purple bg-accent-purple/10 text-white'
                      : 'border-dark-border bg-dark-secondary text-text-secondary hover:border-accent-purple/50'
                  }`}
                >
                  <p className="text-sm font-medium">{level.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{level.subtitle}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Skills</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-purple/10 border border-accent-purple/20 text-sm text-white"
                >
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-text-muted hover:text-accent-red transition-colors">
                    <HiOutlineX className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 px-4 py-2.5 bg-dark-secondary border border-dark-border rounded-xl text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
                placeholder="Add a skill..."
              />
              <button
                onClick={addSkill}
                className="px-4 py-2.5 bg-accent-purple/20 border border-accent-purple/30 rounded-xl text-accent-purple hover:bg-accent-purple/30 transition-colors shrink-0 flex items-center justify-center gap-2 sm:gap-0"
              >
                <HiOutlinePlus className="w-5 h-5" />
                <span className="sm:hidden text-sm">Add Skill</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-dark-border">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-accent-purple to-accent-blue text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <HiOutlinePencil className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
