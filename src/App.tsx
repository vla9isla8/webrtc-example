import {memo, useEffect, useMemo, useState} from 'react'
import './App.css'
import Client from "./db/Client";
import LoginPage from "./components/LoginPage";
import Room from "./components/Room";

function App() {
    const [active, setActive] = useState(false);

    const client = useMemo(() => new Client(), []);

    useEffect(() => {
        client.getUser().then((user) => {
            setActive(Boolean(user))
        }).catch(alert);
    }, [client])

    if (!active) {
        return <LoginPage client={client} onSuccess={() => setActive(true)}/>
    }

    return (
        <Room/>
    )
}

export default memo(App)
