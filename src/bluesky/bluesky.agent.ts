import { AtpAgent } from "@atproto/api";

export const login = async (username: string, password: string) => {
  const agent = new AtpAgent({
    service: "https://bsky.social"
  });
  
  const data = await agent.login({
    identifier: username,
    password: password  
  });

  return {
    data,
    agent
  };
};
