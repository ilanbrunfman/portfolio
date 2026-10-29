import { Navigate } from 'react-router-dom'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { SCREENS } from '@/pages/taim/data/screens'

/** /taim → the first screen the picked person may use */
const TaimHome = () => {
    const { session } = useStaff()
    const first = SCREENS.find((screen) => session.screens.includes(screen.id))
    return <Navigate to={`/taim/${first.id}`} replace />
}

export default TaimHome
