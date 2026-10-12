import CoverSlide from './CoverSlide'
import MoaSlide from './MoaSlide'
import EfficacySlide from './EfficacySlide'
import DosingSlide from './DosingSlide'
import SafetySlide from './SafetySlide'
import SummarySlide from './SummarySlide'

// Maps a deck node's `component` key to its slide component.
export const SLIDE_COMPONENTS = {
    cover: CoverSlide,
    moa: MoaSlide,
    efficacy: EfficacySlide,
    dosing: DosingSlide,
    safety: SafetySlide,
    summary: SummarySlide,
}
