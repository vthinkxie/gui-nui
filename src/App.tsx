import {
  AlipayOutlined,
  AudioOutlined,
  ShoppingCartOutlined,
  TaobaoOutlined,
} from "@ant-design/icons";
import { ChatModule } from "@mlc-ai/web-llm";
import { Divider, Input, Spin } from "antd";
import { ReactNode, useEffect, useRef, useState } from "react";

interface ComponentItem {
  name: string;
  description: string;
}

const componentList: ComponentItem[] = [
  { name: "buy", description: "when user want to buy something" },
  { name: "cart", description: "when user want to see shop cart" },
  { name: "checkout", description: "when user want to checkout" },
  { name: "no result", description: "when there is no result" },
];

const componentMap: { [key: string]: ReactNode } = {
  buy: <TaobaoOutlined />,
  cart: <ShoppingCartOutlined />,
  checkout: <AlipayOutlined />,
};
async function getVicunaChat() {
  const chat = new ChatModule();
  await chat.reload("vicuna-v1-7b-q4f32_0");
  const systemPrompt = `you are acting as a component advisor, when people as you questions, only return the most relevant component item in json format with name and description keys from the component list below \n ${JSON.stringify(
    componentList
  )}`;
  await chat.generate(systemPrompt);
  return chat;
}

const useVicunaChat = () => {
  const [chat, setChat] = useState<ChatModule | null>(null);
  useEffect(() => {
    let innerChat: ChatModule | null = null;
    getVicunaChat().then((chat) => {
      innerChat = chat;
      setChat(chat);
    });
    return () => {
      innerChat?.unload();
    };
  }, []);
  return chat;
};

const useWebSpeechRecognition = (onFinish: () => void) => {
  const recognition = useRef(new (window as any).webkitSpeechRecognition());
  const ignoreOnend = useRef(false);
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");
  recognition.current.continuous = true;
  recognition.current.interimResults = true;
  recognition.current.onerror = () => {
    ignoreOnend.current = true;
  };
  recognition.current.onstart = () => {
    setTranscript("");
    setRecognizing(true);
  };
  recognition.current.onend = function () {
    setRecognizing(false);
    if (ignoreOnend.current) {
      return;
    }
    onFinish();
  };

  recognition.current.onresult = (event: any) => {
    if (typeof event.results == "undefined") {
      recognition.current.onend = null;
      recognition.current.stop();
      return;
    }
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        setTranscript(transcript + event.results[i][0].transcript);
        recognition.current.stop();
      }
    }
  };

  return [recognition.current, recognizing, transcript];
};

function App() {
  const chat = useVicunaChat();
  const [recognition, recognizing, transcript] = useWebSpeechRecognition(() => {
    setLoading(true);
    chat!
      .generate(transcript, () => setLoading(false))
      .then((res) => {
        const regex = /```json\n([\s\S]*?)```/gm;
        const match = regex.exec(res);
        const json = match ? match[1] : null;
        console.log(res, json);
        try {
          setComponent(JSON.parse(json as string));
        } catch (e) {
          console.log(e);
        }
      });
  });
  const [loading, setLoading] = useState(false);
  const [component, setComponent] = useState<ComponentItem | null>(null);
  const suffix = (
    <AudioOutlined
      onClick={() => {
        if (recognizing) {
          recognition.stop();
        } else {
          recognition.start();
        }
      }}
      style={{
        fontSize: 16,
        color: "#1677ff",
      }}
    />
  );
  return (
    <Spin spinning={!chat}>
      <Input
        placeholder="input search text"
        size="large"
        suffix={suffix}
        value={transcript}
      />
      <Divider></Divider>
      <Spin spinning={loading}>
        <div style={{ fontSize: "128px", textAlign: "center" }}>
          {component && componentMap[component.name]}
        </div>
      </Spin>
    </Spin>
  );
}

export default App;
