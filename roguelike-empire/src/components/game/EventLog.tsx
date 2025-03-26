import React from 'react'
import '../../styles/game/EventLog.css'
import { Event } from '../../types/gameTypes'

type EventLogProps = {
  events: Event[]
}

const EventLog: React.FC<EventLogProps> = ({ events }) => {
  return (
    <div className="event-log">
      <h2 className="log-title">事件日志</h2>
      
      {events.length === 0 ? (
        <div className="no-events">暂无事件记录</div>
      ) : (
        <div className="events-list">
          {events.map(event => (
            <div 
              key={event.id} 
              className={`event-item ${event.type}`}
            >
              <div className="event-header">
                <span className="event-title">{event.title}</span>
                <span className="event-turn">回合 {event.turn}</span>
              </div>
              <p className="event-description">{event.description}</p>
              <div className="event-effect">{event.effect}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventLog