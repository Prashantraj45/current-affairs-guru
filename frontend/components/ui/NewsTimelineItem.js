import TopicRow from './TopicRow';

export default function NewsTimelineItem({ topic, date, showLine = true }) {
  return (
    <div className="relative pl-7">
      {showLine ? <div className="timeline-line absolute bottom-0 left-2 top-0 hidden w-px sm:block" /> : null}
      <span className="absolute left-[5px] top-5 h-3.5 w-3.5 rounded-full border border-primary/40 bg-primary/30" />
      <div className="glass-panel rounded-xl border p-2.5">
        <TopicRow topic={topic} date={date} />
      </div>
    </div>
  );
}
