import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';


// Animation variants for the intro card
const introContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.25,
        },
    },
};

const introItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface IntroParams {
    handleUserContinue: () => void
    handleUserDiscontinue: (stageNum: number) => void
}

export default function Intro(intro : IntroParams){
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 px-4 text-white">
        <Card className="w-full max-w-3xl bg-opacity-20 backdrop-blur-md border-gray-700">
          <CardContent>
            <motion.div
              variants={introContainer}
              initial="hidden"
              animate="visible"
              className="space-y-6 text-center"
            >
              <motion.p variants={introItem} className="text-lg md:text-xl">
                To build your plan, I need to understand your current routine and how I can make it better.
              </motion.p>
              <motion.p
                variants={introItem}
                className="text-lg md:text-xl font-medium"
              >
                Do you have 5 minutes to talk right now?
              </motion.p>
              <motion.p variants={introItem} className="text-sm text-muted-foreground">
                Don't worry! Your chat will never be used for anything else.
              </motion.p>
              <motion.div
                variants={introItem}
                className="flex justify-center gap-4 pt-4"
              >
                <Button
                  onClick={() => intro.handleUserContinue()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Yeah! Let's Go
                </Button>
                <Button
                  onClick={() => intro.handleUserDiscontinue(-1)}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  I'll do this later
                </Button>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    )
}