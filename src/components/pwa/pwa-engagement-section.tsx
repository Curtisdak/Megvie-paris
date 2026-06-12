"use client"

import { motion } from "framer-motion"
import { fadeInUp } from "@/lib/motion"
import { InstallAppCard } from "@/components/pwa/install-app-card"
import { PushNotificationCard } from "@/components/pwa/push-notification-card"

export function PwaEngagementSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className="grid gap-5 lg:grid-cols-2"
    >
      <InstallAppCard />
      <PushNotificationCard />
    </motion.section>
  )
}
