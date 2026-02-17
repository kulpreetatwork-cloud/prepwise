import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from '../models/Template.js';

dotenv.config();

const defaultTemplates = [
  {
    name: 'Quick Behavioral Warmup',
    description: 'A friendly 5-minute behavioral practice session to ease into interview mode',
    config: {
      role: 'fullstack',
      type: 'behavioral',
      difficulty: 'easy',
      experienceLevel: 'fresher',
      duration: 5,
      focusAreas: [],
      interviewStyle: 'friendly',
      companyStyle: 'general',
      mode: 'practice',
    },
    color: '#10B981',
    isDefault: true,
  },
  {
    name: 'FAANG Technical Deep Dive',
    description: 'Rigorous 20-minute technical interview simulating big tech company standards',
    config: {
      role: 'fullstack',
      type: 'technical',
      difficulty: 'hard',
      experienceLevel: 'mid',
      duration: 20,
      focusAreas: ['System Design', 'APIs', 'Databases'],
      interviewStyle: 'challenging',
      companyStyle: 'faang',
      mode: 'assessment',
    },
    color: '#EF4444',
    isDefault: true,
  },
  {
    name: 'Startup Full Stack',
    description: 'Mixed interview covering breadth of knowledge in a startup environment',
    config: {
      role: 'fullstack',
      type: 'mixed',
      difficulty: 'medium',
      experienceLevel: 'junior',
      duration: 15,
      focusAreas: ['React', 'Node.js', 'Databases'],
      interviewStyle: 'neutral',
      companyStyle: 'startup',
      mode: 'assessment',
    },
    color: '#F59E0B',
    isDefault: true,
  },
  {
    name: 'HR Round Practice',
    description: 'Corporate-style HR round focusing on culture fit and communication',
    config: {
      role: 'fullstack',
      type: 'hr',
      difficulty: 'easy',
      experienceLevel: 'fresher',
      duration: 10,
      focusAreas: [],
      interviewStyle: 'friendly',
      companyStyle: 'corporate',
      mode: 'practice',
    },
    color: '#3B82F6',
    isDefault: true,
  },
];

async function seedTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Template.countDocuments({ isDefault: true });
    if (existing > 0) {
      console.log(`${existing} default templates already exist. Skipping seed.`);
    } else {
      await Template.insertMany(defaultTemplates);
      console.log(`Seeded ${defaultTemplates.length} default templates.`);
    }

    await mongoose.disconnect();
    console.log('Done.');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedTemplates();
