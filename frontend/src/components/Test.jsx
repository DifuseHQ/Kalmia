import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';


function Test() {
  const initialData = [
    { id: '1', content: 'Row 1' },
    { id: '2', content: 'Row 2' },
    { id: '3', content: 'Row 3' },
    // Add more rows as needed
  ];
  
  
  const [data, setData] = useState(initialData);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(data);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setData(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Content</th>
          </tr>
        </thead>
        <Droppable droppableId="table-rows">
          {(provided) => (
            <tbody ref={provided.innerRef} {...provided.droppableProps}>
              {data.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <tr
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <td>{item.id}</td>
                      <td>{item.content}</td>
                    </tr>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </tbody>
          )}
        </Droppable>
      </table>
    </DragDropContext>
  );
}

export default Test;
