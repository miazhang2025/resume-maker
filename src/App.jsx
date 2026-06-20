import { useState } from 'react';
import Intro from './components/Intro';
import Sidebar from './components/Sidebar';
import Step1Upload from './components/steps/Step1Upload';
import Step2JDInput from './components/steps/Step2JDInput';
import Step3Selection from './components/steps/Step3Selection';
import Step4Polish from './components/steps/Step4Polish';
import Step5Skills from './components/steps/Step5Skills';
import Step6Export from './components/steps/Step6Export';

export default function App() {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [resumeData, setResumeData] = useState(null);
  const [jdData, setJdData] = useState(null);
  const [selectionData, setSelectionData] = useState(null);
  const [polishData, setPolishData] = useState(null);
  const [skillsData, setSkillsData] = useState(null);

  function markComplete(step) {
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step]);
  }

  function renderStep() {
    switch (currentStep) {
      case 1:
        return (
          <Step1Upload
            onComplete={data => { setResumeData(data); markComplete(1); setCurrentStep(2); }}
            initialData={resumeData}
          />
        );
      case 2:
        return (
          <Step2JDInput
            onComplete={data => { setJdData(data); markComplete(2); setCurrentStep(3); }}
            onBack={() => setCurrentStep(1)}
            initialData={jdData}
          />
        );
      case 3:
        return (
          <Step3Selection
            onComplete={data => { setSelectionData(data); markComplete(3); setCurrentStep(4); }}
            onBack={() => setCurrentStep(2)}
            resumeData={resumeData}
            jdData={jdData}
            initialData={selectionData}
          />
        );
      case 4:
        return (
          <Step4Polish
            onComplete={data => { setPolishData(data); markComplete(4); setCurrentStep(5); }}
            onBack={() => setCurrentStep(3)}
            jdData={jdData}
            selectionData={selectionData}
            initialData={polishData}
          />
        );
      case 5:
        return (
          <Step5Skills
            onComplete={data => { setSkillsData(data); markComplete(5); setCurrentStep(6); }}
            onBack={() => setCurrentStep(4)}
            resumeData={resumeData}
            jdData={jdData}
            selectionData={selectionData}
            polishData={polishData}
            initialData={skillsData}
          />
        );
      case 6:
        return (
          <Step6Export
            onBack={() => setCurrentStep(5)}
            resumeData={resumeData}
            jdData={jdData}
            selectionData={selectionData}
            polishData={polishData}
            skillsData={skillsData}
          />
        );
      default:
        return null;
    }
  }

  if (!started) {
    return <Intro onStart={() => setStarted(true)} />;
  }

  return (
    <div className="flex min-h-screen app-glow">
      <Sidebar
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        completedSteps={completedSteps}
        onHome={() => setStarted(false)}
      />
      <main className="flex-1 px-10 py-10 overflow-auto">
        {renderStep()}
      </main>
    </div>
  );
}
