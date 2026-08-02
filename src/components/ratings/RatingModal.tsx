import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface RatingModalProps {
  isOpen: boolean;
  toUserId: string;
  toUserName: string;
  donationId: string;
  donationTitle: string;
  onClose: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  toUserId,
  toUserName,
  donationId,
  donationTitle,
  onClose,
}) => {
  const { submitRating } = useApp();
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [reliabilityScore, setReliabilityScore] = useState<number>(100);
  const [comment, setComment] = useState<string>('Punctual, clear communication, and excellent food handling standards.');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStarClick = (star: number) => {
    setRatingValue(star);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitRating(toUserId, donationId, ratingValue, reliabilityScore, comment);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-lg p-8 relative mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h3 className="font-headline-md text-primary font-bold">Rating Submitted!</h3>
            <p className="font-body-md text-sm text-on-surface-variant mt-2">
              Partner&apos;s Average Rating &amp; Reliability % have been updated dynamically.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container text-xs rounded-full font-label-md uppercase tracking-wider mb-2">
                Post-Completion Review
              </span>
              <h2 className="font-headline-md text-primary font-bold">Rate Your Partner</h2>
              <p className="font-body-md text-sm text-on-surface-variant mt-1">
                Feedback for <strong className="text-primary">{toUserName}</strong> on post &ldquo;{donationTitle}&rdquo;
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating (1-5) */}
              <div>
                <label className="font-label-md text-sm text-on-surface-variant block mb-2 text-center">
                  Overall Experience (1 to 5 Stars)
                </label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      className="text-amber-400 hover:scale-125 transition-transform focus:outline-none"
                    >
                      <span
                        className="material-symbols-outlined text-4xl"
                        style={{ fontVariationSettings: star <= ratingValue ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs font-bold text-primary mt-1">
                  {ratingValue} / 5.0 Stars
                </p>
              </div>

              {/* Reliability Score (%) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-label-md text-sm text-on-surface-variant">
                    Reliability Score (Punctuality &amp; Standards)
                  </label>
                  <span className="font-bold text-sm text-secondary bg-secondary-container/50 px-2.5 py-0.5 rounded-full">
                    {reliabilityScore}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={reliabilityScore}
                  onChange={(e) => setReliabilityScore(parseInt(e.target.value))}
                  className="w-full accent-secondary h-2 bg-surface-container-high rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                  <span>50% (Delayed / Issues)</span>
                  <span>100% (Perfect Execution)</span>
                </div>
              </div>

              {/* Comment input */}
              <div>
                <label className="font-label-md text-sm text-on-surface-variant block mb-2">
                  Comments / Notes
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-lg border-outline-variant focus:border-secondary focus:ring-secondary text-sm p-3 bg-surface-bright"
                  placeholder="Share details about the pickup, packaging, or communication..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-sm hover:bg-surface-container-low transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-primary text-on-primary font-label-md text-sm py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
