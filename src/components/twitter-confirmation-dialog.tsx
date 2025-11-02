"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface TwitterConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incidentId: string
  prId?: string
  tweetText: string
  onConfirm: () => void
  onSkip: () => void
  isPosting?: boolean
}

export default function TwitterConfirmationDialog({
  open,
  onOpenChange,
  incidentId,
  prId,
  tweetText,
  onConfirm,
  onSkip,
  isPosting = false,
}: TwitterConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleSkip = () => {
    onSkip()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post to Twitter/X?</DialogTitle>
          <DialogDescription>
            An incident has been resolved. Would you like to post an announcement to Twitter/X?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Incident Details:</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Incident ID: <span className="font-mono text-xs">{incidentId}</span></p>
              {prId && (
                <p>PR ID: <span className="font-mono text-xs">{prId}</span></p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Tweet Preview:</p>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-card-foreground whitespace-pre-wrap break-words">
                  {tweetText}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {tweetText.length} / 280 characters
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isPosting}
          >
            Skip
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isPosting}
          >
            {isPosting ? "Posting..." : "Post Tweet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

