import {
  AlipayOutlined,
  ShoppingCartOutlined,
  TaobaoOutlined,
} from "@ant-design/icons";
import { ChatModule } from "@mlc-ai/web-llm";
import { Button, Divider, Input, Spin } from "antd";
import { ReactNode, useEffect, useState } from "react";

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

function App() {
  const chat = useVicunaChat();
  const [loading, setLoading] = useState(false);
  const [component, setComponent] = useState<ComponentItem | null>(null);
  const [text, setText] = useState("");
  return (
    <Spin spinning={!chat}>
      <Input.TextArea
        value={text}
        onChange={(v) => setText(v.target.value)}
      ></Input.TextArea>
      <Divider></Divider>
      <Button
        type="primary"
        block
        loading={loading}
        onClick={() => {
          setLoading(true);
          chat!
            .generate(text, () => setLoading(false))
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
        }}
      >
        Submit
      </Button>
      <Divider></Divider>
      <div style={{ fontSize: "128px", textAlign: "center" }}>
        {component && componentMap[component.name]}
      </div>
    </Spin>
  );
}

export default App;
