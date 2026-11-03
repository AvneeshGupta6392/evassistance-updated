const SUGGESTIONS = [
  { icon: "ev_station", text: "How do I find the best EV charging station?" },
  { icon: "battery_charging_full", text: "How can I make my EV battery last longer?" },
  { icon: "savings", text: "Is an EV cheaper than a petrol car in the long run?" },
  { icon: "directions_car", text: "Which EV is best for a daily city commute?" },
];

const Suggestions = ({ onPick, disabled }) => (
  <div className="suggestions" aria-label="Suggested questions">
    {SUGGESTIONS.map((s) => (
      <button
        key={s.text}
        type="button"
        className="chip"
        disabled={disabled}
        onClick={() => onPick(s.text)}
      >
        <span className="material-symbols-outlined">{s.icon}</span>
        {s.text}
      </button>
    ))}
  </div>
);

export default Suggestions;
