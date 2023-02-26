import Client from "../db/Client";
import "./styles.css";
import {DetailedHTMLProps, FormEvent, FormEventHandler, HTMLAttributes, useCallback, useState} from "react";


function Form({children, ...rest}: DetailedHTMLProps<HTMLAttributes<HTMLFormElement>, HTMLFormElement>) {
    return (
        <form {...rest}>
            <fieldset>
                <label>
                    Username
                    <input type="text" name="username"/>
                </label>
            </fieldset>
            <fieldset>
                <label>
                    Password
                    <input type="password" name="password"/>
                </label>
            </fieldset>
            {children}
        </form>
    )
}

function getData(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username")?.toString();
    const password = formData.get("password")?.toString();
    return {username, password};
}

function LoginPage({client, onSuccess}: { client: Client, onSuccess: () => void }) {

    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const handleSignIn: FormEventHandler<HTMLFormElement> = useCallback((event) => {
        event.stopPropagation();
        event.preventDefault();
        const {username, password} = getData(event);
        if (username && password) {
            setError(null);
            setSubmitting(true);
            client.signIn(username, password)
                .then(onSuccess)
                .catch(setError)
                .finally(() => setSubmitting(false));
        }

    }, [client, onSuccess])

    const handleSignUp: FormEventHandler<HTMLFormElement> = useCallback((event) => {
        event.stopPropagation();
        event.preventDefault();
        const {username, password} = getData(event);
        if (username && password) {
            setError(null);
            setSubmitting(true);
            client.signUp(username, password)
                .then(onSuccess)
                .catch(setError)
                .finally(() => setSubmitting(false));
        }
    }, [client, onSuccess]);

    return (
        <div className="login-forms">
            <h2 className="login-form-title">Enter the room</h2>
            <section className="form">
                <h4>Sing in</h4>
                <Form onSubmit={handleSignIn}>
                    <button type="submit" disabled={submitting}>Login</button>
                </Form>
            </section>
            <section className="form">
                <h4>Sing up</h4>
                <Form onSubmit={handleSignUp}>
                    <button type="submit" disabled={submitting}>Create</button>
                </Form>
            </section>
            <section className="login-form-title">
                <span>{JSON.stringify(error)}</span>
            </section>
        </div>
    )
}

export default LoginPage;
