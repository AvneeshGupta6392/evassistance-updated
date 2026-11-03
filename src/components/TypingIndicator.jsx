import ChatbotIcon from "./ChatbotIcon";

const TypingIndicator = () => (
  <div className="message bot-message" role="status" aria-label="Assistant is typing">
    <ChatbotIcon />
    <div className="message-text typing">
      <span /><span /><span />
    </div>
  </div>
);

export default TypingIndicator;
