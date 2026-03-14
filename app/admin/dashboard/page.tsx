import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function Page() {
    const supabase = await createClient();
    // You can also use getUser() which will be slower.
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    if (!user) {
        redirect("/login");
    }

    if (!user.is_admin) {
        redirect("/profile");
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
            <p className="text-lg text-gray-600">This is the admin dashboard page.</p>
            <p className="text-sm text-gray-500 mt-2">Welcome, {user.email}!</p>
        </div>
    );
};

export default Page;


