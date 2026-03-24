'use client'

interface XpEvent { id: number; amount: number }

interface Props {
  events: XpEvent[]
}

export default function XpFloater({ events }: Props) {
  return (
    <>
      {events.map((e, i) => (
        <div
          key={e.id}
          className="xp-float"
          style={{
            top: '40px',
            right: `${40 + i * 60}px`,
          }}
        >
          +{e.amount} XP!
        </div>
      ))}
    </>
  )
}
