export function WelcomeMessage({ shop }) {
    return (
        <>
            {shop?.brand?.slogan && shop?.brand?.slogan != '' ? (<div className="welcome-section text-center pt-5 pb-5"  style={mystyle}>
                <div className="column">
                    <p>{shop.brand.slogan}</p>
                </div>
            </div>) : null}
        </>
    );
}
const mystyle = {
    color: "white",
    backgroundColor: "#000"
};
