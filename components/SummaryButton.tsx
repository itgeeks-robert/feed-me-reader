import React, { useState } from 'react';
import { summarizeArticle } from '../services/summaryService';

interface SummaryButtonProps {
  articleTitle: string;
  articleText: string;
}

export const SummaryButton: React.FC<SummaryButtonProps> = ({ articleTitle, articleText }) => {
  const [summary, setSummary] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await summarizeArticle(articleTitle, articleText);
      setSummary(result);
    } catch (err) {
      console.error('Failed to summarize:', err);
      setError('AI offline');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="summary-container">
      {!summary && (
        <button 
          className="void-btn summarize-button" 
          onClick={handleSummarize}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="spinner" />
          ) : (
            'SUMMARISE'
          )}
        </button>
      )}

      {error && <p className="error-text">{error}</p>}

      {summary && (
        <div className="summary-card animate-fade-in">
          <h4 className="summary-title">NUTRI-INSIGHT</h4>
          <ul className="summary-list">
            {summary.map((point, index) => (
              <li key={index} className="summary-item">
                <span className="bullet-dot" />
                <span className="summary-text">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        .summary-container {
          margin: 16px 0;
          width: 100%;
        }

        .summarize-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 120px;
          min-height: 36px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 800ms linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: var(--c-muted);
          margin-top: 8px;
        }

        .summary-card {
          background: var(--c-elevated);
          border: 1px solid var(--c-border);
          border-radius: var(--r-card);
          padding: 16px;
          width: 100%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .summary-title {
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--c-accent);
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .summary-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .bullet-dot {
          width: 6px;
          height: 6px;
          background: var(--c-accent);
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .summary-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          line-height: 1.4;
          color: var(--c-ink);
        }

        .animate-fade-in {
          animation: fade-in 400ms ease forwards;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
