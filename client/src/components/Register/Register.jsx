import { FaGoogle } from 'react-icons/fa';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import OTPVerification from './OtpVerification';
import { useState } from 'react';
import './Register.scss'
import { toast } from 'react-toastify';
import usePostFetch from '../../hooks/usePostFetch';


const Register = () => {


    const [passwordVisible, setPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };
    const [otpOpen, setOtpOpen] = useState(false);



    const googleAuth = () => {
        window.open("http://localhost:3000/api/v1/auth/google",
            '_self'
        )
    }

    const [registerUserCredentials, setRegisterUserCredentials] = useState({
        email: "",
        password: "",
    });

    const handleRegisterChange = (e) => {
        setRegisterUserCredentials(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    }

    const handleOtpSent = async (e) => {
        e.preventDefault();
        const data = await usePostFetch('/send-otp', { email: registerUserCredentials.email });

        if (data && data.data) {
            if (!data.data.success) {
                toast.warn(data.data.message, {
                    position: "top-right"
                });
            } else {
                setOtpOpen(true);
                toast.success(data.data.message, {
                    position: "top-right"
                });
            }
        }


    }



    return (
        <div className="login-container">
            <form className="login-form" onSubmit={(e) => { handleOtpSent(e) }}>
                <h2>Register</h2>
                <div className="input-wrap">
                    <input type="email" id="reg-email" name='email' value={registerUserCredentials.email} placeholder='' onChange={(e) => handleRegisterChange(e)} />
                    <label htmlFor="reg-email">Email</label>
                </div>
                <div className="input-wrap">
                    <input type={passwordVisible ? "text" : "password"} id="reg-password" name='password' placeholder='' value={registerUserCredentials.password} onChange={(e) => handleRegisterChange(e)} />
                    <label htmlFor="reg-password">Password</label>
                    <span className="toggle-password" onClick={togglePasswordVisibility}>
                        {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>
                <button className="login-button">Register</button>
                <div className="google-button">

                    <div className='google-btn-image' onClick={googleAuth}>
                        <FaGoogle />
                    </div>
                    <div>
                        <span>Register with Google</span>
                    </div>
                </div>
            </form>

            <OTPVerification email={registerUserCredentials.email} password={registerUserCredentials.password} resend={handleOtpSent} isOpen={otpOpen} onClose={setOtpOpen} />
        </div>
    )
}
export default Register;