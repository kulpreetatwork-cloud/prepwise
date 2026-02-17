import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  HiOutlineArrowLeft, HiOutlineDownload, HiOutlineRefresh,
  HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineChevronDown,
  HiOutlineChevronUp, HiOutlineStar, HiOutlineClock,
} from 'react-icons/hi';
import api from '../services/api';
import { jsPDF } from 'jspdf';

export default function Feedback() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const { data } = await api.get(`/interviews/${id}/feedback`);
        setFeedback(data.feedback);
        setInterview(data.interview);
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [id]);

  const getGradeColor = (grade) => {
    if (grade?.startsWith('A')) return 'text-accent-green';
    if (grade?.startsWith('B')) return 'text-accent-blue';
    if (grade?.startsWith('C')) return 'text-accent-yellow';
    return 'text-accent-red';
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'from-accent-green to-emerald-400';
    if (score >= 70) return 'from-accent-blue to-cyan-400';
    if (score >= 55) return 'from-accent-yellow to-orange-400';
    return 'from-accent-red to-rose-400';
  };

  const getScoreBg = (score) => {
    if (score >= 85) return 'bg-accent-green/10 border-accent-green/20';
    if (score >= 70) return 'bg-accent-blue/10 border-accent-blue/20';
    if (score >= 55) return 'bg-accent-yellow/10 border-accent-yellow/20';
    return 'bg-accent-red/10 border-accent-red/20';
  };

  const handleDownloadPDF = () => {
    if (!feedback || !interview) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(24);
    doc.setTextColor(139, 92, 246);
    doc.text('Prepwise', 20, 25);

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Interview Feedback Report', 20, 35);

    doc.setDrawColor(139, 92, 246);
    doc.line(20, 40, pageWidth - 20, 40);

    let y = 55;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Role: ${interview.config?.role || 'N/A'}`, 20, y);
    doc.text(`Type: ${interview.config?.type || 'N/A'}`, 20, y + 7);
    doc.text(`Difficulty: ${interview.config?.difficulty || 'N/A'}`, 20, y + 14);
    doc.text(`Date: ${new Date(interview.startedAt).toLocaleDateString()}`, 20, y + 21);
    y += 35;

    doc.setFontSize(40);
    doc.setTextColor(139, 92, 246);
    doc.text(`${feedback.overallScore}`, pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.setFontSize(16);
    doc.text(`Grade: ${feedback.grade}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text('Category Scores', 20, y);
    y += 8;

    doc.setFontSize(10);
    const cats = feedback.categoryScores;
    ['Communication', 'Technical Accuracy', 'Confidence', 'Clarity', 'Relevance'].forEach((cat, i) => {
      const key = ['communication', 'technicalAccuracy', 'confidence', 'clarity', 'relevance'][i];
      doc.setTextColor(80, 80, 80);
      doc.text(`${cat}: ${cats[key]}%`, 25, y);
      y += 6;
    });
    y += 8;

    if (feedback.strengths?.length > 0) {
      doc.setFontSize(13);
      doc.setTextColor(16, 185, 129);
      doc.text('Strengths', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      feedback.strengths.forEach((s) => {
        doc.text(`+ ${s}`, 25, y);
        y += 6;
      });
      y += 5;
    }

    if (feedback.improvements?.length > 0) {
      doc.setFontSize(13);
      doc.setTextColor(245, 158, 11);
      doc.text('Areas to Improve', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      feedback.improvements.forEach((s) => {
        doc.text(`- ${s}`, 25, y);
        y += 6;
      });
      y += 5;
    }

    if (feedback.overallFeedback) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text('Overall Feedback', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(feedback.overallFeedback, pageWidth - 40);
      doc.text(lines, 20, y);
    }

    doc.save(`Prepwise-Feedback-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No feedback found</h2>
          <p className="text-text-secondary mb-6">This interview may not have generated feedback.</p>
          <Link to="/dashboard" className="text-accent-purple hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const radarData = [
    { subject: 'Communication', value: feedback.categoryScores.communication },
    { subject: 'Technical', value: feedback.categoryScores.technicalAccuracy },
    { subject: 'Confidence', value: feedback.categoryScores.confidence },
    { subject: 'Clarity', value: feedback.categoryScores.clarity },
    { subject: 'Relevance', value: feedback.categoryScores.relevance },
  ];

  const barData = radarData.map((d) => ({ name: d.subject, score: d.value }));

  return (
    <div className="min-h-screen bg-dark-primary p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors">
            <HiOutlineArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-dark-secondary border border-dark-border rounded-xl text-sm text-text-secondary hover:text-white hover:border-accent-purple/50 transition-all"
            >
              <HiOutlineDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={() => navigate('/interview/setup')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-blue text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              Retake
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-text-muted text-sm mb-6">
            <span className="capitalize">{interview?.config?.role}</span>
            <span>-</span>
            <span className="capitalize">{interview?.config?.type}</span>
            <span>-</span>
            <span className="capitalize">{interview?.config?.difficulty}</span>
            {interview?.startedAt && (
              <>
                <span>-</span>
                <span>{new Date(interview.startedAt).toLocaleDateString()}</span>
              </>
            )}
          </div>

          <div className="relative inline-block mb-4">
            <svg className="w-28 h-28 sm:w-40 sm:h-40" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#2A2A4A" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                strokeWidth="8" strokeLinecap="round"
                stroke="url(#scoreGrad)"
                strokeDasharray={`${(feedback.overallScore / 100) * 339.3} 339.3`}
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl font-bold text-white">{feedback.overallScore}</span>
              <span className="text-xs text-text-muted">out of 100</span>
            </div>
          </div>

          <div className="inline-block px-5 py-2 rounded-full text-lg font-bold"
               style={{
                 background: feedback.grade?.startsWith('A') ? 'rgba(16,185,129,0.1)' :
                             feedback.grade?.startsWith('B') ? 'rgba(59,130,246,0.1)' :
                             feedback.grade?.startsWith('C') ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                 border: `1px solid ${feedback.grade?.startsWith('A') ? 'rgba(16,185,129,0.25)' :
                             feedback.grade?.startsWith('B') ? 'rgba(59,130,246,0.25)' :
                             feedback.grade?.startsWith('C') ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
               }}>
            <span className={getGradeColor(feedback.grade)}>Grade {feedback.grade}</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Score Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2A2A4A" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Category Scores</h3>
            <div className="space-y-4">
              {radarData.map((cat) => (
                <div key={cat.subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{cat.subject}</span>
                    <span className="text-white font-medium">{cat.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.value}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(cat.value)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HiOutlineCheckCircle className="w-5 h-5 text-accent-green" />
              Strengths
            </h3>
            <div className="space-y-3">
              {feedback.strengths?.map((strength, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-accent-green/5 border border-accent-green/10">
                  <span className="text-accent-green mt-0.5 shrink-0">&#10003;</span>
                  <p className="text-sm text-text-primary">{strength}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HiOutlineExclamationCircle className="w-5 h-5 text-accent-yellow" />
              Areas to Improve
            </h3>
            <div className="space-y-3">
              {feedback.improvements?.map((improvement, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-accent-yellow/5 border border-accent-yellow/10">
                  <span className="text-accent-yellow mt-0.5 shrink-0">&#10148;</span>
                  <p className="text-sm text-text-primary">{improvement}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {feedback.questionFeedback?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Question-by-Question Breakdown</h3>
            <div className="space-y-3">
              {feedback.questionFeedback.map((qf, i) => (
                <div key={i} className={`rounded-xl border overflow-hidden ${getScoreBg(qf.score)}`}>
                  <button
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-r ${getScoreColor(qf.score)} text-white text-sm font-bold`}>
                        {qf.score}
                      </div>
                      <p className="text-sm font-medium text-white truncate">{qf.question}</p>
                    </div>
                    {expandedQ === i ? (
                      <HiOutlineChevronUp className="w-5 h-5 text-text-muted shrink-0" />
                    ) : (
                      <HiOutlineChevronDown className="w-5 h-5 text-text-muted shrink-0" />
                    )}
                  </button>

                  {expandedQ === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="px-4 pb-4 space-y-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Your Answer</p>
                        <p className="text-sm text-text-secondary bg-dark-primary/50 p-3 rounded-lg">{qf.userAnswer || 'No answer recorded'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Feedback</p>
                        <p className="text-sm text-text-primary">{qf.feedback}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-accent-purple uppercase tracking-wider mb-1">Ideal Answer</p>
                        <p className="text-sm text-text-secondary bg-accent-purple/5 p-3 rounded-lg border border-accent-purple/10">{qf.idealAnswer}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {feedback.overallFeedback && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HiOutlineStar className="w-5 h-5 text-accent-purple" />
              Overall Assessment
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">{feedback.overallFeedback}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
