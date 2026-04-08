import { redirect } from "next/navigation";

const Home = () => {
    redirect("/admin/login"); // Redirige al login.
}

export default Home