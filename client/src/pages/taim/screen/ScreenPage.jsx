import { useParams } from 'react-router-dom'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { SCREENS, ROLE_LABELS } from '@/pages/taim/data/screens'
import MenuEditor from '@/pages/taim/menu/MenuEditor'
import Floor from '@/pages/taim/floor/Floor'
import OrderList from '@/pages/taim/order/OrderList'
import OrderPage from '@/pages/taim/order/OrderPage'
import Kitchen from '@/pages/taim/kitchen/Kitchen'
import Bills from '@/pages/taim/bills/Bills'

// Screens that are built so far; the rest show what they will do
const BUILT = { floor: Floor, order: OrderList, kitchen: Kitchen, menu: MenuEditor, bills: Bills }
// Screens with a detail page (/taim/order/:orderId)
const DETAIL = { order: OrderPage }

/**
 * /taim/:screen – one Ta'im screen. Screens not built yet show what
 * they will do and which build step brings them.
 * A screen the role can't use says so (the server refuses its data too).
 */
const ScreenPage = () => {
    const params = useParams()
    // /taim/order/12 has no :screen param; it's the order screen's detail page
    const id = params.screen ?? 'order'
    const detail = params.orderId !== undefined
    const { session } = useStaff()
    const screen = SCREENS.find((s) => s.id === id)

    if (!screen) {
        return (
            <div className="taim__notice surface d-flex flex-column gap-1" role="alert">
                <h2 className="taim__heading">No such screen</h2>
                <p className="form__hint">Pick a screen from the menu.</p>
            </div>
        )
    }

    if (!session.screens.includes(screen.id)) {
        return (
            <div className="taim__notice surface d-flex flex-column gap-1" role="alert">
                <span className="taim__eyebrow">{screen.label}</span>
                <h2 className="taim__heading">Not for your role</h2>
                <p className="form__hint">
                    A {ROLE_LABELS[session.staff.role]} can't use this screen. Switch person to see it.
                </p>
            </div>
        )
    }

    const Built = detail ? DETAIL[screen.id] : BUILT[screen.id]
    if (Built) return <Built />

    return (
        <div className="taim__notice surface d-flex flex-column gap-1">
            <span className="taim__eyebrow">{screen.label}</span>
            <h2 className="taim__heading">Coming in step {screen.step}</h2>
            <p>{screen.about}</p>
        </div>
    )
}

export default ScreenPage
