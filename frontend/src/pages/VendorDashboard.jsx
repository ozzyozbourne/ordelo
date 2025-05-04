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

                const response = await axios.get("http://localhost:8080/login", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Role": role
                    }
                });

                const data = response.data;
                console.log("Backend verified:", data);

                if (!data.role || data.role !== "vendor") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("role");
                    navigate("/vendor/login");
                }

            } catch (error) {
                console.error("Verification failed:", error.response?.data || error.message);
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
