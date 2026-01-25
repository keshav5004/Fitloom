import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="text-gray-600 body-font relative">
        {/* Background */}
        <div
          className="fixed inset-0"
          style={{
            backgroundImage: 'url("/background.jpg")',
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center 21%",
            opacity: 0.4,
          }}
        ></div>

        <div className="relative z-10">
          {/* no side padding on mobile */}
          <div className="container px-0 sm:px-5 py-16 sm:py-24 mx-auto">

            {/* Hero */}
            <div className="flex flex-col items-center text-center mb-20 sm:mb-55 mt-3 sm:mt-5 px-4 sm:px-0">
              <h1 className="text-3xl sm:text-5xl font-bold mb-2 bg-linear-to-r from-blue-600 via-teal-500 to-green-600 bg-clip-text text-transparent">
                Wear with Fit with Fitloom.com
              </h1>
              <p className="w-full sm:lg:w-1/2 text-gray-500 text-sm sm:text-base">
                Whatever you want ? what do you want ? you want Code? Then Wear The Code
              </p>
            </div>

            {/* ================= OFFERS ================= */}
            <div className="text-center mb-10 bg-red-300 p-4 sm:p-5 rounded-[500px] sm:rounded-4xl mx-4 sm:mx-0">
              <span className="inline-block px-3 sm:px-4 py-1 text-base sm:text-xl rounded-full bg-red-100 text-red-600 mb-2 sm:mb-3">
                Special Offers
              </span>
              <h2 className="text-xl sm:text-4xl font-bold text-gray-900">
                Limited Time <span className="text-red-600">Deals</span>
              </h2>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-xl">
                Dont miss out on these exclusive limited-time offers
              </p>
            </div>

            {/* ===== PRODUCT CARDS ===== */}
            <div className="grid grid-cols-3 gap-3 sm:gap-8 mb-16 sm:mb-24 sm:px-0">
              {["Shooting Stars", "The Catalyzer", "Neptune"].map((title, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-lg border flex flex-col justify-between min-h-[260px] sm:min-h-[380px]"
                >
                  {/* Image */}
                  <div className="h-28 sm:h-44 bg-linear-to-br from-blue-100 to-teal-100 flex items-center justify-center rounded-t-xl">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-teal-200"></div>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1">
                        {title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Fingerstache flexitarian street art 8-bit waist co.
                      </p>
                    </div>

                    {/* Button aligned for all cards */}
                    <button className="mt-3 w-full py-2 sm:py-2.5 rounded-lg text-white text-xs sm:text-base font-medium bg-linear-to-r from-blue-600 to-green-500 hover:opacity-90">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ================= FEATURED PRODUCTS ================= */}
            <div className="text-center mb-10 bg-blue-200 p-5 sm:p-10 rounded-2xl sm:rounded-4xl mt-20 sm:mt-40 mx-4 sm:mx-0">
              <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">
                Featured <span className="text-blue-500">Products</span>
              </h2>
              <p className="text-gray-600 mt-1 sm:mt-2 text-base sm:text-xl">
                Discover our exclusive collection of premium clothing
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-8 px-2 sm:px-0">
              {["Melanchole", "Bunker", "Ramona Falls"].map((title, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-lg border flex flex-col justify-between min-h-[260px] sm:min-h-[380px]"
                >
                  <div className="h-28 sm:h-44 bg-linear-to-br from-blue-100 to-teal-100 flex items-center justify-center rounded-t-xl">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-teal-200"></div>
                  </div>

                  <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1">
                        {title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Fingerstache flexitarian street art 8-bit waist co.
                      </p>
                    </div>

                    <button className="mt-3 w-full py-2 sm:py-2.5 rounded-lg text-white text-xs sm:text-base font-medium bg-linear-to-r from-blue-600 to-green-500 hover:opacity-90">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link href="/product">
              <button
                className="flex mx-auto mt-24 sm:mt-40 px-6 sm:px-10 py-3 sm:py-4 
                text-white text-base sm:text-lg font-semibold rounded-lg sm:rounded-xl 
                bg-linear-to-r from-blue-600 via-teal-500 to-green-600
                shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Explore Collection
              </button>
            </Link>

          </div>
        </div>
      </section>
    </>
  );
}
