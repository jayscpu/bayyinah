import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const faqs = [
  {
    question: 'What is Bayyinah?',
    answer: 'Bayyinah is an educational assessment platform built on a simple conviction: understanding cannot be measured by recall alone. Traditional exams reward students who reproduce memorized text, while penalizing those who reason in their own words. Bayyinah reverses this by replacing static grading with Socratic dialogue \u2014 a structured, AI-driven conversation that surfaces how deeply a student has engaged with the material, not merely whether they can repeat it.',
  },
  {
    question: 'How does the Socratic dialogue work?',
    answer: 'Once you submit your answer to an exam question, the AI initiates a three-round exchange. Each round poses a single, carefully constructed follow-up question designed to probe the logic behind your response. It may ask you to reconcile a contradiction, extend your reasoning to an adjacent case, or defend an assumption you made implicitly. The AI never agrees or disagrees with you \u2014 it only asks. The complete transcript of this exchange is then delivered to your instructor as the primary artifact of your assessment.',
  },
  {
    question: 'How is my work evaluated?',
    answer: 'Evaluation happens in two stages. First, the AI produces a preliminary score on a 0\u2013100 scale by analyzing your dialogue across four weighted criteria: conceptual understanding, the ability to connect ideas across topics, practical application of theory, and logical coherence of your reasoning. Second, your instructor reads the full transcript \u2014 your original answer and all three dialogue rounds \u2014 and assigns a final grade on a 1\u20135 scale. The AI score informs but never dictates the instructor\'s judgment.',
  },
  {
    question: 'What happens if I select the wrong MCQ option?',
    answer: 'A wrong selection is not the end of the conversation \u2014 it is the beginning of one. If you chose an incorrect option but demonstrate through the Socratic dialogue that your underlying reasoning is sound, that you understand why the correct answer is correct, or that your interpretation reflects a legitimate reading of the material, you can still earn meaningful credit. Bayyinah is designed to distinguish between a student who guessed incorrectly and a student who reasoned incorrectly. The two are not the same.',
  },
  {
    question: 'What materials can instructors upload?',
    answer: 'Instructors upload course materials in PDF or PPTX format. These documents are parsed, segmented into meaningful passages, and indexed into a retrieval system. When the AI generates exam questions or engages in Socratic dialogue, it draws directly from this indexed material \u2014 ensuring that every question and every follow-up is grounded in what was actually taught, not in the AI\'s general knowledge.',
  },
  {
    question: 'When will I receive my results?',
    answer: 'Your results become visible only after your instructor has personally reviewed the dialogue transcript and submitted a final grade. This is by design. Bayyinah treats assessment as a deliberate act of human judgment, not an automated pipeline. You will see the AI\'s preliminary score alongside your instructor\'s grade and any written feedback they choose to provide.',
  },
  {
    question: 'Does the AI monitor me during the exam?',
    answer: 'No. The AI plays no role during the answer-writing phase of the exam. It activates only after you submit each answer, and its sole function is to ask clarifying questions. It does not proctor, does not track your behavior, and does not make any judgments until the dialogue begins. Its purpose is inquiry, not surveillance.',
  },
  {
    question: 'Why Socratic dialogue instead of traditional grading?',
    answer: 'A written answer is a finished product \u2014 it reveals what a student chose to say, but conceals the depth of what they understand. Socratic dialogue opens a window into the reasoning process itself. A student who memorized a textbook paragraph will struggle to defend it under questioning. A student who genuinely understands the concept will find the dialogue natural, even clarifying. The method does not punish memorization \u2014 it simply stops rewarding it as a substitute for thought.',
  },
];

export default function FAQ() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { user } = useAuthStore();
  const dashboardPath = user?.role === 'teacher' ? '/teacher' : '/student';

  return (
    <div className="min-h-screen paper-bg flex flex-col">
      <Link to="/" className="fixed top-6 right-8 z-50 hover:opacity-80 transition-opacity">
        <span className="brand-text">بيّنة</span>
      </Link>

      {/* Nav bar */}
      <nav className="landing-nav">
        <div className="flex gap-8">
          <Link to="/">Home</Link>
        </div>
        <div className="flex gap-8">
          <Link to="/vision">Philosophy</Link>
          {user ? (
            <Link to={dashboardPath}>Dashboard</Link>
          ) : (
            <Link to="/login">Sign In</Link>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-[700px] animate-fade-in">
          {/* Ornament */}
          <div className="flex justify-center mb-8">
            <img src="/assets/diamond.png" alt="" className="h-10 w-auto" />
          </div>

          <h1 className="font-serif text-3xl text-charcoal-800 tracking-wider uppercase text-center mb-2">
            Frequently Asked Questions
          </h1>

          <hr className="dotted-divider" />

          <div className="timeline mt-8">
            {faqs.map((faq, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-bullet">
                  <img src="/assets/diamond.png" alt="" />
                </div>
                <div>
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full text-left timeline-bar hover:bg-warmgray-300 transition-colors cursor-pointer"
                  >
                    <p className="font-serif text-sm text-charcoal-800 flex-1 leading-relaxed">
                      {faq.question}
                    </p>
                  </button>
                  {expanded === i && (
                    <div className="px-6 py-4 animate-fade-in">
                      <p className="text-sm text-charcoal-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="page-footer">
        <p className="footer-quote">إن للمرء عقلٌ يستضيء بهِ</p>
      </div>
    </div>
  );
}
