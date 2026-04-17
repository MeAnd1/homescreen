import React, { useState } from "react";
import { EditorPasswordProvider } from "./EditorPasswordContext";
import EditorOc from "./EditorOc";
import EditorInfection from "./EditorInfection";
import EditorBackstory from "./EditorBackstory";
import "./EditorCommon.css";

type EditorTab = "ocs" | "infection" | "backstory";

const Editor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EditorTab>("ocs");

  const tabs = [
    { id: "ocs" as const, label: "OCs", component: EditorOc },
    {
      id: "infection" as const,
      label: "Infection",
      component: EditorInfection,
    },
    {
      id: "backstory" as const,
      label: "Backstory",
      component: EditorBackstory,
    },
  ];

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component;

  return (
    <EditorPasswordProvider>
      <div className="editor-container">
        <div className="editor-header">
          <h2>Kataa behind the screen</h2>
        </div>

        <div className="editor-button-group">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`editor-button ${
                activeTab === tab.id
                  ? "editor-button-primary"
                  : "editor-button-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="editor-content">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </EditorPasswordProvider>
  );
};

export default Editor;
