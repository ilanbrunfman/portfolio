import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Icon from '@/components/ui/icon/Icon'
import Button from '@/components/ui/button/Button'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import { formatMoney } from '@/pages/taim/utils/money'
import { allergenText } from '@/pages/taim/utils/allergens'
import './DishList.scss'

// Rows only move up and down
const verticalOnly = ({ transform }) => ({ ...transform, x: 0 })

/**
 * One category's dishes, in order, as rows you can drag to reorder (mouse,
 * touch or keyboard, using the grip handle). Each row: name and
 * description, price, "On menu", Edit.
 * Without onReorder there's no grip, without onEdit no Edit (the menu in
 * use: only "On menu" changes there).
 *
 * @param {object} props
 * @param {object[]} props.dishes                       The category's dishes, top first.
 * @param {(dishIds: number[]) => void} [props.onReorder] Called with the new order after a drop.
 * @param {(dish: object) => void} [props.onToggle]     Switch a dish on/off the menu; without it, no "On menu" box (read only).
 * @param {(dish: object) => void} [props.onEdit]       Open the dish's edit form.
 * @param {number|null} [props.toggling]                Id of the dish being switched (its box is disabled).
 */
const DishList = ({ dishes, onReorder, onToggle, onEdit, toggling = null }) => {
    const sensors = useSensors(
        // Mouse and touch; a 5px move starts a drag, so a tap is still a tap
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        // Keyboard: Space/Enter picks up, arrows move, Space/Enter drops, Esc cancels
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )
    const ids = dishes.map((dish) => dish.id)
    const nameOf = (id) => dishes.find((dish) => dish.id === id)?.name ?? 'dish'
    const placeOf = (id) => `${ids.indexOf(id) + 1} of ${ids.length}`

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return
        onReorder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)))
    }

    // What screen readers hear while dragging, with dish names instead of ids
    const accessibility = {
        screenReaderInstructions: {
            draggable: 'To reorder, press Space or Enter, move with the arrow keys, then press Space or Enter again. Escape cancels.',
        },
        announcements: {
            onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}, position ${placeOf(active.id)}.`,
            onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} is now at position ${placeOf(over.id)}.` : undefined),
            onDragEnd: ({ active, over }) => (over ? `Dropped ${nameOf(active.id)} at position ${placeOf(over.id)}.` : `Dropped ${nameOf(active.id)}.`),
            onDragCancel: ({ active }) => `Cancelled. ${nameOf(active.id)} is back where it was.`,
        },
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[verticalOnly]}
            onDragEnd={handleDragEnd}
            accessibility={accessibility}
        >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <ul className="dish-list">
                    {dishes.map((dish) => (
                        <DishRow
                            key={dish.id}
                            dish={dish}
                            onToggle={onToggle}
                            onEdit={onEdit}
                            canDrag={Boolean(onReorder)}
                            toggling={toggling === dish.id}
                        />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    )
}

/** One draggable row; only the grip handle starts a drag */
const DishRow = ({ dish, onToggle, onEdit, canDrag, toggling }) => {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: dish.id, disabled: !canDrag })
    const style = { transform: CSS.Transform.toString(transform), transition }

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`dish-list__row d-flex align-items-start gap-1 ${dish.hidden ? 'is-sold-out' : ''} ${isDragging ? 'is-dragging' : ''}`}
        >
            {canDrag && (
                <button
                    type="button"
                    ref={setActivatorNodeRef}
                    className="dish-list__handle"
                    aria-label={`Reorder ${dish.name}`}
                    {...attributes}
                    {...listeners}
                >
                    <Icon name="IconDotsSixVertical" size={18} />
                </button>
            )}

            <div className="dish-list__body d-flex flex-wrap align-items-start gap-1">
                <div className="dish-list__text d-flex flex-column">
                    <span className="dish-list__name">
                        {dish.name}
                        {dish.hidden && <span className="dish-list__tag">Sold out</span>}
                    </span>
                    {dish.description && <span className="form__hint">{dish.description}</span>}
                    {dish.prepMinutes && <span className="dish-list__prep">Prep {dish.prepMinutes} min</span>}
                    {dish.allergens?.length > 0 && <span className="dish-list__allergens">Contains {allergenText(dish.allergens)}</span>}
                </div>
                {/* Price, toggle and Edit wrap together under the name on narrow screens */}
                <div className="dish-list__controls d-flex align-items-center gap-1">
                    <span className="dish-list__price">{formatMoney(dish.price)}</span>
                    {onToggle && <Checkbox label="On menu" checked={!dish.hidden} onChange={() => onToggle(dish)} disabled={toggling} />}
                    {onEdit && (
                        <Button size="sm" variant="ghost" onClick={() => onEdit(dish)}>
                            Edit
                        </Button>
                    )}
                </div>
            </div>
        </li>
    )
}

export default DishList
