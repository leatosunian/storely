import LoaderFullscreen from '@/components/admin/LoaderFullscreen'
import React from 'react'
import { redirect } from "next/navigation";

const Home = () => {
    redirect("/admin/login"); // Redirige automáticamente al usuario.
    return (
        <LoaderFullscreen />
    )
}

export default Home