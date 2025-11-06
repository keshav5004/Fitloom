import React from 'react'
import Link from 'next/link'

function Footer() {
    return (
        <div>
            <footer className="bg-gray-900 text-gray-300 py-1  bottom-0 w-full sticky ">
                <div className="container mx-auto px-6 lg:px-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Logo & About */}
                        <div>
                            <Link href={"/"}>
                             <h2 className="text-xl font-bold text-white">Codeswear</h2>
                            </Link>
                            <p className="mt-2 text-sm text-gray-400">
                                Your one-stop shop for all products. Quality and trust delivered.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
                            <ul className="mt-2 space-y-2">
                                <li>
                                    <Link href="/" className="hover:text-white">
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/product" className="hover:text-white">
                                        Products
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/about" className="hover:text-white">
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/contact" className="hover:text-white">
                                        Contact
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-white">Contact</h3>
                            <ul className="mt-2 space-y-2 text-sm">
                                <li>Email: support@myshop.com</li>
                                <li>Phone: +91 98765 43210</li>
                                <li>Address: New Delhi, India</li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="mt-8 border-t border-gray-700 pt-4 text-center text-sm text-gray-400">
                        © {new Date().getFullYear()} Codeswear. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Footer