import './PageNotFound.scss'

const status = '404'
const message = 'Page not found'

const PageNotFoundPage = () => {
    return(
        <div className="page-not-found">

            <div className="error">
                <span className="status">{status}</span>
                <hr className='divider'/>
                <div className="message">
                    <h1>{ message }</h1>
                </div>
            </div>

        </div>
    )
}

export default PageNotFoundPage