import { Link } from '@/lib/router';
import { Mail } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function Footer({
  hidden = false,
}: {
  hidden?: boolean;
}) {
  const { theme } = useTheme();

  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/lcp.works/',
      icon: (
        <svg
          className="w-5 h-5 fill-current shrink-0"
          viewBox="0 0 24 24"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.644-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'Mail',
      href: 'mailto:contact@example.com',
      icon: (
        <Mail
          className="
            w-5 h-5
            shrink-0
            stroke-[1.75]
          "
        />
      ),
    },
  ];

  return (
    <footer
      data-sticky-footer
      className="
        w-full
        bg-white
        dark:bg-[#121212]
        lg:border-t
        border-white
        dark:border-[#121212]
        select-none
        overflow-hidden
        transform-gpu
        backface-hidden
        transition-colors
        duration-300
      "
      style={{
        ...(hidden
          ? {
              opacity: 0,
              visibility: 'hidden',
            }
          : {}),
        paddingBottom:
          'env(safe-area-inset-bottom)',
        backgroundColor:
          theme === 'dark' ? '#121212' : '#ffffff',
        borderTopColor:
          theme === 'dark' ? '#121212' : '#ffffff',
      }}
    >
      <div
        className="
          max-w-7xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          pt-4
          pb-6
          lg:pb-10
        "
      >
        {/* =================================================
            BRAND
            ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-3
            gap-10
          "
        >
          <div className="md:col-span-2">
            <div
              className="
                flex
                items-center
                mb-4
                -mt-2
              "
            >
              <img
                src="https://raw.githubusercontent.com/itsspaco0809/scitem-images/main/LCP_logo_trans.png"
                alt="LCP logo"
                className="
                  h-16
                  w-auto
                  object-contain
                  brightness-0
                  dark:invert
                  transition-all
                  duration-300
                "
              />
            </div>

            <p
              className="
                text-neutral-600
                dark:text-neutral-400
                text-sm
                leading-relaxed
                max-w-md
                transition-colors
                duration-300
              "
            >
              Premium custom brick kits inspired by the world's
              most iconic vehicles. Built for collectors, by
              collectors.
            </p>

            <div
              className="
                flex
                gap-3
                mt-6
              "
            >
              {socialLinks.map(
                (item, i) => (
                  <a
                    key={i}
                    href={item.href}
                    aria-label={item.name}
                    target={
                      item.href.startsWith(
                        'http'
                      )
                        ? '_blank'
                        : undefined
                    }
                    rel={
                      item.href.startsWith(
                        'http'
                      )
                        ? 'noopener noreferrer'
                        : undefined
                    }
                    className="
                      w-10
                      h-10
                      rounded-lg
                      bg-neutral-100
                      dark:bg-[#1a1a1a]
                      border
                      border-neutral-200
                      dark:border-neutral-800
                      flex
                      items-center
                      justify-center
                      text-neutral-600
                      dark:text-neutral-400
                      hover:text-neutral-950
                      dark:hover:text-white
                      hover:bg-neutral-200
                      dark:hover:bg-neutral-800
                      transition-all
                      duration-300
                      hover:scale-105
                      shrink-0
                      touch-manipulation
                    "
                  >
                    {item.icon}
                  </a>
                )
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            BOTTOM BAR
            ================================================= */}

        <div
          className="
            mt-8
            pt-6
            lg:mt-12
            lg:pt-8
            border-t
            border-neutral-200
            dark:border-neutral-800
            flex
            flex-col
            lg:flex-row
            items-center
            justify-between
            gap-6
            transition-colors
            duration-300
          "
        >
          <p
            className="
              text-neutral-500
              dark:text-neutral-500
              text-xs
              text-center
              lg:text-left
              transition-colors
              duration-300
            "
          >
            © {new Date().getFullYear()} LCP.works All rights
            reserved. Not affiliated with the LEGO Group or
            any automobile manufacturers.
          </p>

          <div
            className="
              flex
              flex-col
              sm:flex-row
              items-center
              gap-6
            "
          >
            {/* =================================================
                LEGAL LINKS
                ================================================= */}

            <div
              className="
                flex
                gap-6
              "
            >
              <Link
                to="/privacy-policy"
                className="
                  text-neutral-500
                  dark:text-neutral-500
                  text-xs
                  hover:text-neutral-950
                  dark:hover:text-white
                  transition-colors
                  duration-300
                "
              >
                Privacy Policy
              </Link>

              <Link
                to="/terms-of-service"
                className="
                  text-neutral-500
                  dark:text-neutral-500
                  text-xs
                  hover:text-neutral-950
                  dark:hover:text-white
                  transition-colors
                  duration-300
                "
              >
                Terms of Service
              </Link>

              <Link
                to="/shipping-info"
                className="
                  text-neutral-500
                  dark:text-neutral-500
                  text-xs
                  hover:text-neutral-950
                  dark:hover:text-white
                  transition-colors
                  duration-300
                "
              >
                Shipping Info
              </Link>
            </div>

            {/* =================================================
                PAYMENT ICONS
                ================================================= */}

            <div
              className="
                flex
                items-center
                gap-1.5
                shrink-0
              "
            >
              {/* Apple Pay */}

              <div
                className="
                  h-6
                  px-2
                  rounded
                  bg-neutral-100
                  dark:bg-[#1a1a1a]
                  border
                  border-neutral-200
                  dark:border-neutral-800
                  flex
                  items-center
                  justify-center
                  font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]
                  transition-colors
                  duration-300
                "
              >
                <span
                  className="
                    text-[11px]
                    font-semibold
                    tracking-tight
                    text-neutral-900
                    dark:text-white
                    flex
                    items-center
                    gap-0.5
                    transition-colors
                    duration-300
                  "
                >
                  <span
                    className="
                      text-[13px]
                      leading-none
                      -mt-0.5
                    "
                  >
                    
                  </span>
                  Pay
                </span>
              </div>

              {/* VISA */}

              <div
                className="
                  h-6
                  px-2
                  rounded
                  bg-neutral-100
                  dark:bg-[#1a1a1a]
                  border
                  border-neutral-200
                  dark:border-neutral-800
                  flex
                  items-center
                  justify-center
                  transition-colors
                  duration-300
                "
              >
                <span
                  className="
                    font-extrabold
                    italic
                    text-[11px]
                    tracking-wider
                    text-neutral-900
                    dark:text-white
                    transition-colors
                    duration-300
                  "
                >
                  VISA
                </span>
              </div>

              {/* Mastercard */}

              <div
                className="
                  h-6
                  px-2
                  rounded
                  bg-neutral-100
                  dark:bg-[#1a1a1a]
                  border
                  border-neutral-200
                  dark:border-neutral-800
                  flex
                  items-center
                  justify-center
                  transition-colors
                  duration-300
                "
              >
                <div
                  className="
                    flex
                    items-center
                    -space-x-1.5
                  "
                >
                  <div
                    className="
                      w-3
                      h-3
                      rounded-full
                      bg-[#EB001B]
                    "
                  />
                  <div
                    className="
                      w-3
                      h-3
                      rounded-full
                      bg-[#F79E1B]
                      opacity-90
                    "
                  />
                </div>
              </div>

              {/* AMEX */}

              <div
                className="
                  h-6
                  px-1.5
                  rounded
                  bg-[#016FD0]
                  flex
                  items-center
                  justify-center
                "
              >
                <span
                  className="
                    font-bold
                    text-[9px]
                    text-white
                    tracking-tight
                  "
                >
                  AMEX
                </span>
              </div>

              {/* JCB */}

              <div
                className="
                  h-6
                  px-1.5
                  rounded
                  bg-neutral-100
                  dark:bg-[#1a1a1a]
                  border
                  border-neutral-200
                  dark:border-neutral-800
                  flex
                  items-center
                  justify-center
                  transition-colors
                  duration-300
                "
              >
                <div
                  className="
                    flex
                    items-center
                    h-3.5
                    rounded-[2px]
                    overflow-hidden
                  "
                >
                  <div
                    className="
                      bg-[#003A8F]
                      h-full
                      px-0.5
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <span
                      className="
                        font-extrabold
                        text-[8px]
                        text-white
                        leading-none
                      "
                    >
                      J
                    </span>
                  </div>

                  <div
                    className="
                      bg-[#E60012]
                      h-full
                      px-0.5
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <span
                      className="
                        font-extrabold
                        text-[8px]
                        text-white
                        leading-none
                      "
                    >
                      C
                    </span>
                  </div>

                  <div
                    className="
                      bg-[#00873C]
                      h-full
                      px-0.5
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <span
                      className="
                        font-extrabold
                        text-[8px]
                        text-white
                        leading-none
                      "
                    >
                      B
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
