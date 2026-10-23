import CoverSlide from './cover/CoverSlide'
import MoaSlide from './moa/MoaSlide'
import EfficacySlide from './efficacy/EfficacySlide'
import PrimaryEndpointSlide from './efficacy/views/PrimaryEndpointSlide'
import ResponseOverTimeSlide from './efficacy/views/ResponseOverTimeSlide'
import StudyDesignSlide from './efficacy/views/StudyDesignSlide'
import DosingSlide from './dosing/DosingSlide'
import RegimenSlide from './dosing/views/RegimenSlide'
import AdministrationSlide from './dosing/views/AdministrationSlide'
import SafetySlide from './safety/SafetySlide'
import AdverseReactionsSlide from './safety/views/AdverseReactionsSlide'
import WarningsSlide from './safety/views/WarningsSlide'
import SummarySlide from './summary/SummarySlide'

// Maps a deck node's `component` key to its slide component.
// Every slide receives { data, slide, onNavigate, getSlide } — see SlideDeck.md.
export const SLIDE_COMPONENTS = {
    cover: CoverSlide,
    moa: MoaSlide,
    efficacy: EfficacySlide,
    efficacyPrimary: PrimaryEndpointSlide,
    efficacyOverTime: ResponseOverTimeSlide,
    efficacyDesign: StudyDesignSlide,
    dosing: DosingSlide,
    dosingRegimen: RegimenSlide,
    dosingAdministration: AdministrationSlide,
    safety: SafetySlide,
    safetyReactions: AdverseReactionsSlide,
    safetyWarnings: WarningsSlide,
    summary: SummarySlide,
}
