import IconArrowLeft from './icons/IconArrowLeft'
import IconBrowsers from './icons/IconBrowsers'
import IconCards from './icons/IconCards'
import IconCaretRight from './icons/IconCaretRight'
import IconCaretUp from './icons/IconCaretUp'
import IconChevronRight from './icons/IconChevronRight'
import IconGithub from './icons/IconGithub'
import IconHome from './icons/IconHome'
import IconLayout from './icons/IconLayout'
import IconLinkedin from './icons/IconLinkedin'
import IconList from './icons/IconList'
import IconListBullets from './icons/IconListBullets'
import IconMinus from './icons/IconMinus'
import IconMonitor from './icons/IconMonitor'
import IconMoon from './icons/IconMoon'
import IconMagnifyingGlass from './icons/IconMagnifyingGlass'
import IconPlus from './icons/IconPlus'
import IconSignIn from './icons/IconSignIn'
import IconSignOut from './icons/IconSignOut'
import IconSun from './icons/IconSun'
import IconTrash from './icons/IconTrash'
import IconUser from './icons/IconUser'
import IconStack from './icons/IconStack'
import IconTable from './icons/IconTable'
import IconTabs from './icons/IconTabs'
import IconTwitter from './icons/IconTwitter'
import IconX from './icons/IconX'

// Register all your icons here
const icons = {
    IconArrowLeft: IconArrowLeft,
    IconBrowsers: IconBrowsers,
    IconCards: IconCards,
    IconCaretRight: IconCaretRight,
    IconCaretUp: IconCaretUp,
    IconChevronRight: IconChevronRight,
    IconGithub: IconGithub,
    IconHome: IconHome,
    IconLayout: IconLayout,
    IconLinkedin: IconLinkedin,
    IconList: IconList,
    IconListBullets: IconListBullets,
    IconMinus: IconMinus,
    IconMonitor: IconMonitor,
    IconMoon: IconMoon,
    IconMagnifyingGlass: IconMagnifyingGlass,
    IconPlus: IconPlus,
    IconSignIn: IconSignIn,
    IconSignOut: IconSignOut,
    IconSun: IconSun,
    IconTrash: IconTrash,
    IconUser: IconUser,
    IconStack: IconStack,
    IconTable: IconTable,
    IconTabs: IconTabs,
    IconTwitter: IconTwitter,
    IconX: IconX,
};

const Icon = ({ name, size = 18, strokeWidth = 2, color, className = '', ...props }) => {
    const Component = icons[name];

    if (!Component) {
        console.warn(`Icon "${name}" does not exist!`);
        return null;
    }

    return <Component size={size} strokeWidth={strokeWidth} color={color} className={className} {...props} />;
};

export default Icon;