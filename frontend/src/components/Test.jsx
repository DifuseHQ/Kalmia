import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const initialData = [
  { id: "1", name: "Row 1", title: "Title 1", slug: "slug1" },
  { id: "2", name: "Row 2", title: "Title 2", slug: "slug2" },
  { id: "3", name: "Row 3", title: "Title 3", slug: "slug3" },
  { id: "4", name: "Row 4", title: "Title 4", slug: "slug4" },
];

export default function TableWithDragAndDrop() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(data);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setData(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th>ID</th>
            <th>Content</th>
          </tr>
        </thead>
        <Droppable droppableId="tableRows">
          {(provided) => (
            <tbody ref={provided.innerRef} {...provided.droppableProps}>
              {loading ? (
                <tr>
                  <td colSpan="4">Loading...</td>
                </tr>
              ) : data.length <= 0 ? (
                <tr>
                  <td colSpan="4">No Pages Found</td>
                </tr>
              ) : (
                data.map((obj, index) => (
                  <Draggable key={obj.id} draggableId={obj.id} index={index}>
                    {(provided, snapshot) => (
                      <tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`border ${
                          snapshot.isDragging ? "bg-gray-800" : "bg-white"
                        }`}
                      >
                        <td className="px-4 py-2">{obj.id}</td>
                        <td className="px-4 py-2">{obj.title}</td>
                      </tr>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </tbody>
          )}
        </Droppable>
      </table>
    </DragDropContext>
  );
}
