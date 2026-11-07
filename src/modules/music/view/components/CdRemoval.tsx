import { ConfirmDialog } from '../../../common/components/ConfirmDialog'
import { ContextMenu } from '../../../common/components/ContextMenu'
import { useCdRemovalStore } from '../hooks/useCdRemovalStore'

export function CdRemoval() {
  const menu = useCdRemovalStore((state) => state.menu)
  const confirming = useCdRemovalStore((state) => state.confirming)
  const error = useCdRemovalStore((state) => state.error)
  const closeMenu = useCdRemovalStore((state) => state.closeMenu)
  const ask = useCdRemovalStore((state) => state.ask)
  const cancel = useCdRemovalStore((state) => state.cancel)
  const confirm = useCdRemovalStore((state) => state.confirm)

  return (
    <>
      {menu && (
        <ContextMenu
          key={`${menu.cd.id}:${menu.x}:${menu.y}`}
          x={menu.x}
          y={menu.y}
          label={menu.cd.title}
          actions={[{ label: 'Remove from shelf', onSelect: () => ask(menu.cd) }]}
          onClose={closeMenu}
        />
      )}
      {confirming && (
        <ConfirmDialog
          title="Remove from shelf"
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={() => void confirm()}
          onCancel={cancel}
        >
          <p>{`Remove "${confirming.title}" from the shelf? This deletes its saved files and can't be undone.`}</p>
          {error && (
            <p className="win-dialog-error" role="alert">
              {error}
            </p>
          )}
        </ConfirmDialog>
      )}
    </>
  )
}
