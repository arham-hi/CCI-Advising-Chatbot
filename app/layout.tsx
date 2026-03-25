import "./global.css"

export const metadata = {title: "CCI-Advisor", description: "online advisor chatbot"}

const RootLayout = ({ children }) => {
    return (
        <html lang = "en">
            <body>
                {children}
            </body>
        </html>
    )
}

export default RootLayout