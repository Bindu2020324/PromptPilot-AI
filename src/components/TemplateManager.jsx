import { useState } from "react";
import { saveTemplate } from "../services/templateService";

export default function TemplateManager() {
  const [name, setName] = useState("");
  const [persona, setPersona] = useState("");

  async function handleSave() {
    await saveTemplate({
      name,
      persona,
    });

    alert("Template Saved");

    setName("");
    setPersona("");
  }

  return (
    <div>
      <h2>Custom Templates</h2>

      <input
        placeholder="Template Name"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

      <br />
      <br />

      <textarea
        placeholder="Persona Prompt"
        value={persona}
        onChange={(e) =>
          setPersona(e.target.value)
        }
      />

      <br />
      <br />

      <button onClick={handleSave}>
        Save Template
      </button>
    </div>
  );
}