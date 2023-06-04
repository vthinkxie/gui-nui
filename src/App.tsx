import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {ChatModule, InitProgressReport} from "@mlc-ai/web-llm";



function setLabel(id: string, text: string) {
  const label = document.getElementById(id);
  if (label == null) {
    throw Error("Cannot find label " + id);
  }
  label.innerText = text;
}

async function main() {
  const chat = new ChatModule();

  chat.setInitProgressCallback((report: InitProgressReport) => {
    setLabel("init-label", report.text);
  });

  await chat.reload("vicuna-v1-7b-q4f32_0");

  const generateProgressCallback = (_step: number, message: string) => {
    setLabel("generate-label", message);
  };

  const prompt0 = "What is the capital of Canada?";
  setLabel("prompt-label", prompt0);
  const reply0 = await chat.generate(prompt0, generateProgressCallback);
  console.log(reply0);

  const prompt1 = "Can you write a poem about it?";
  setLabel("prompt-label", prompt1);
  const reply1 = await chat.generate(prompt1, generateProgressCallback);
  console.log(reply1);

  console.log(await chat.runtimeStatsText());
}

main();

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
