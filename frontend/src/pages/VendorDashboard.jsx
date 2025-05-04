import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function VendorDashboard() {
    const navigate = useNavigate();

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const token = localStorage.getItem("token");
                const role = localStorage.getItem("role");

                if (!token || role !== "vendor") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("role");
                    navigate("/vendor/login");
                    return;
                }


                const { data } = await axios.get("http://localhost:7001/auth", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Role": role 
                    }
                });

                console.log("Backend verified:", data);

            } catch (error) {
                console.log(error.response?.data || error.message);
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                navigate("/vendor/login");
            }
        };

        verifyToken();
    }, [navigate]);

    return (
        <>
            <h1>Vendor Dashboard</h1>
        </>
    );
}

export default VendorDashboard;
