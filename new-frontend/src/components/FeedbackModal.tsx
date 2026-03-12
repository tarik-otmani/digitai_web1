import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import StarRating from './StarRating';
import { postCourseFeedback } from '../api';

const LABELS: Record<number, string> = {
  1: 'Not helpful',
  2: 'Could be better',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent!',
};

interface FeedbackModalProps {
  courseId: string;
  courseTitle?: string;
  onClose: () => void;
}

export default function FeedbackModal({ courseId, courseTitle, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await postCourseFeedback(courseId, rating, comment);
      setDone(true);
      setTimeout(onClose, 1800);
    } catch {
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-gray-900">Rate this generation</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          /* Success state */
          <div className="px-6 pb-8 pt-2 text-center space-y-3">
            <div className="text-4xl">🎉</div>
            <p className="font-semibold text-gray-900">Thank you for your feedback!</p>
            <p className="text-sm text-gray-500">Your rating helps us improve the quality of AI generation.</p>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-5">
            {courseTitle && (
              <p className="text-sm text-gray-500 truncate">
                Course: <span className="font-medium text-gray-700">{courseTitle}</span>
              </p>
            )}

            {/* Stars */}
            <div className="flex flex-col items-center gap-2 py-2">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <p className={`text-sm font-medium transition-opacity ${rating ? 'opacity-100 text-amber-600' : 'opacity-0'}`}>
                {LABELS[rating] ?? ''}
              </p>
            </div>

            {/* Optional comment */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Comment <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like or dislike about the generated content?"
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
